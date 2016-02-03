#!/usr/bin/env node
import open from 'open';
import yargs from 'yargs';
import {createServer} from '../';

const argv = yargs
  .option('proxy', {
    description: 'URL to proxy to',
    type: 'string',
  })
  .help('help')
  .argv;

global.__IN_DEV_SERVER = true;

const proxies = (
  Array.isArray(argv.proxy) ? argv.proxy : argv.proxy && [argv.proxy] || []
).map((url) => {
  return {url};
});

const server = createServer(argv._, {
  proxies: proxies,
});

/* eslint no-console: 0 */
server.on('ready', () => {
  console.log('💎  Ready.');
});

server.listen(process.env.PORT, () => {
  const url = `http://localhost:${server.address().port}/`;
  console.log(`💎  Listening: ${url}.`);
  if (!process.env.PORT) {
    open(url);
  }
});
