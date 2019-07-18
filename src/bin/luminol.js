#!/usr/bin/env node
// @flow
import yargs from 'yargs';

import createServer from '/createServer';
import createClient from '/internal/createClient';

import Compiler from '/internal/Compiler';
import logListener from '/internal/logListener';

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

yargs
  .option('url', {
    description: 'Server url',
    type: 'string',
  })
  .option('require', {
    description: 'Load node extension before executing',
    type: 'array',
    alias: 'r',
    default: [],
    coerce: (items) => {
      if (!Array.isArray(items)) {
        throw new TypeError('Expected array for `require` values.');
      }
      return items.map((item) => {
        if (typeof item !== 'string') {
          throw new TypeError('Expected string for `require` entry.');
        }
        require(item);
        return item;
      });
    },
  })
  .command(
    'compile [config]',
    'compile a given config file',
    (yargs) => {
      return yargs.option('config', {
        description: 'config file',
        type: 'string',
        alias: 'c',
      });
    },
    (argv) => {
      const client = createClient(argv.url);
      const compiler = new Compiler(client, argv.url);
      compiler.runConfig(argv.config);
    },
  )
  .command(
    'proxy [path] [url]',
    'proxy given path to given url',
    (yargs) => {
      return yargs
        .option('path', {
          type: 'string',
        })
        .option('url', {
          type: 'string',
        });
    },
    (_argv) => {
      // TODO
    },
  )
  .command(
    ['serve', '$0'],
    'serve stuff',
    {
      open: {
        description: 'Automatically open the browser window',
        type: 'boolean',
        default: false,
      },
      clipboard: {
        description: 'Automatically copy the URL to your clipboard',
        type: 'boolean',
        default: true,
      },
      port: {
        description: 'Port to listen on',
        alias: 'p',
        type: 'number',
      },
      config: {
        description: 'Config files to preload',
        alias: 'c',
        type: 'array',
        default: [],
      },
      content: {
        description: 'Directories to serve content from',
        type: 'array',
        default: [],
      },
      log: {
        description: 'Print events from the hub',
        default: true,
      },
      add: {
        description: 'Additional middleware to use',
        type: 'array',
        default: [],
      },
    },
    (argv) => {
      const server = createServer({
        content: argv.content,
        port: argv.port,
        log: argv.log,
        config: argv.config,
        require: argv.require,
        add: argv.add,
        clipboard: argv.clipboard,
      });
      server.on('ready', () => {
        logListener(server.client, (log) => {
          console.log(log.message);
        });
      });
      for (const sig of ['SIGINT', 'SIGTERM']) {
        process.on(sig, () => {
          server.close();
          process.exit();
        });
      }
    },
  )
  .help('help').argv;
