#!/usr/bin/env node
/* eslint no-console: 0 */
import open from 'open';
import yargs from 'yargs';
import path from 'path';
import openport from 'openport';
import {createServer} from '../';

const argv = yargs
  .option('config', {
    description: 'Config files to load',
    type: 'array',
    default: [],
  })
  .option('proxy', {
    description: 'URL to proxy to',
    type: 'string',
  })
  .option('port', {
    description: 'Port to listen on',
    type: 'number',
  })
  .option('slave', {
    description: 'Host of parent server',
    type: 'string',
  })
  .option('open', {
    description: 'Automatically open the browser window',
    type: 'boolean',
    default: false,
  })
  .option('ui', {
    description: 'Enable web interface',
    type: 'boolean',
    default: true,
  })
  .help('help')
  .argv;

if (argv.slave) {
  if (argv.config.length !== 1) {
    console.log('Must provide exactly 1 config in slave mode.');
    process.exit(1);
  }
  // TODO: FIXME: This is kinda hacky.
  process.env.IPC_URL = argv.slave;
  yargs.reset();
  require('../lib/compiler');
} else {
  const proxies = (
    Array.isArray(argv.proxy) ? argv.proxy : argv.proxy && [argv.proxy] || []
  ).map((url) => {
    return {url};
  });

  const configs = [...argv.config];

  // This is a "live" or self-hosted version of the UI. Normally you don't want
  // this unless you are hacking on the UI itself.
  if (argv.ui && process.env.WEBPACK_DEV_UI) {
    configs.push(path.join(
      __dirname,
      '..',
      'ui',
      'webpack.config.babel.js'
    ));
  }

  if (configs.length === 0) {
    console.log('ℹ️  You specified no `config` values.');
  }

  const start = (port) => new Promise((resolve, reject) => {
    const server = createServer(configs, {
      proxies: proxies,
      ui: argv.ui && !process.env.WEBPACK_DEV_UI,
    });
    server.once('error', reject);
    server.listen(port, () => {
      const url = `http://localhost:${server.address().port}/`;
      console.log(`💎  Listening: ${url}.`);
      server.url = url;
      resolve(server);
    });
  });

  const created = (server) => {
    if (argv.open) {
      open(server.url);
    }
    server.on('ready', () => {
      console.log('💎  Ready.');
    });
  };

  const error = (err) => {
    console.error('⚠️  Error occured.');
    console.error(err);
    process.exit(1);
  };

  if (typeof argv.port === 'number') {
    start(argv.port).then(created, error);
  } else if (typeof process.env.PORT === 'string' && process.env.PORT !== '') {
    start(parseInt(process.env.PORT, 10)).then(created, error);
  } else {
    openport.find({
      startingPort: 8080,
      createServer: (port, callback) => {
        start(port).then((server) => callback(null, server), callback);
      },
    }, (err, server) => {
      if (err) {
        error(err);
      } else {
        created(server);
      }
    });
  }
}
