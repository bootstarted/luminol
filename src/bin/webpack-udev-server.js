#!/usr/bin/env node
// @flow
import open from 'open';
import yargs from 'yargs';

import createServer from '/internal/server';
import createProxy from '/internal/proxy';
import createSupervisor from '/internal/supervisor';
import createWatcher from '/internal/watcher';
import createCompiler from '/internal/compiler';

import {proxySet} from '/action/proxy';
import {pathWatched, pathUnwatched} from '/action/watcher';

import {
  createServer as createHubServer,
  createClient as createHubClient,
} from '/hub';

import consoleLogger from '/internal/console';

yargs
  .option('hub', {
    description: 'Hub url',
    type: 'string',
  })
  .command('compile [config]', 'compile webpack config', {
  }, (argv) => {
    const hub = createHubClient(argv.hub);
    const compiler = createCompiler(hub, argv.config);
    compiler.watch({}, () => {
      // TODO: Anything here?
    });
  })
  .command('proxy [path] [url]', 'proxy given path to given url', {

  }, (argv) => {
    const hub = createHubClient(argv.hub);
    hub.dispatch(proxySet({
      path: argv.path,
      url: argv.url,
    }));
    hub.close();
  })
  .command('add [path]', 'add pattern to be compiled', {

  }, (argv) => {
    const hub = createHubClient(argv.hub);
    hub.dispatch(pathWatched(argv.path));
  })
  .command('remove [path]', 'remove pattern from being compiled', {

  }, (argv) => {
    const hub = createHubClient(argv.hub);
    hub.dispatch(pathUnwatched(argv.path));
  })
  .command(['serve', '$0'], 'serve stuff', {
    open: {
      description: 'Automatically open the browser window',
      type: 'boolean',
      default: false,
    },
    port: {
      description: 'Port to listen on',
      type: 'number',
    },
    config: {
      description: 'Config files to preload',
      type: 'array',
      default: [],
    },
    log: {
      description: 'Print events from the hub',
      default: true,
    },
  }, (argv) => {
    createServer({
      port: argv.port,
    }).then((server) => {
      const url = `http://localhost:${server.address().port}`;
      log(`💎  Listening: ${url}.`);
      const hub =
        argv.hub ? createHubClient(argv.hub) : createHubServer({
          server,
          path: '/__webpack_udev_ipc__',
        });
      //  log(`💎  Created hub: ${hub.url}.`);
      if (argv.log) {
        consoleLogger(hub);
      }

      // Responsible for taking `PROXY_SET` actions and making them accessible
      // via the server.
      createProxy(hub, server, {});

      // Responsible for spawning child compilers. The configs to compile are
      // set via `CONFIG_LOADED` and `CONFIG_UNLOADED` actions.
      createSupervisor(hub);

      // Responsible for taking globs and seeing when the underlying fs is
      // changed. Patterns to watch are set via `PATH_WATCHED` and
      // `PATCH_UNWATCHED` actions. In response `CONFIG_LOADED` and
      // `CONFIG_UNLOADED` actions are fired.
      createWatcher(hub);

      argv.config.forEach((config) => {
        hub.dispatch(pathWatched(config));
      });

      if (argv.open) {
        open(url);
      }
    });
  })
  .help('help')
  .argv;

// TODO: Enable quietness here.
const log = (msg) => {
  console.log(msg);
};
