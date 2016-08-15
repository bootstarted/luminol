#!/usr/bin/env node
import open from 'open';
import yargs from 'yargs';
import path from 'path';
import {createServer} from '../';

const argv = yargs
  .option('proxy', {
    description: 'URL to proxy to',
    type: 'string',
  })
  .option('port', {
    description: 'Port to listen on',
    type: 'number',
    default: process.env.PORT || 0,
  })
  .option('ui', {
    description: 'Enable web interface',
    type: 'boolean',
    default: true,
  })
  .help('help')
  .argv;

global.__IN_DEV_SERVER = true;

const proxies = (
  Array.isArray(argv.proxy) ? argv.proxy : argv.proxy && [argv.proxy] || []
).map((url) => {
  return {url};
});

const configs = [...argv._];

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

const server = createServer(configs, {
  proxies: proxies,
  ui: argv.ui && !process.env.WEBPACK_DEV_UI,
});

/* eslint no-console: 0 */
server.on('ready', () => {
  console.log('💎  Ready.');
});

server.listen(argv.port, () => {
  const url = `http://localhost:${server.address().port}/`;
  console.log(`💎  Listening: ${url}.`);
  if (!argv.port) {
    open(url);
  }
});
