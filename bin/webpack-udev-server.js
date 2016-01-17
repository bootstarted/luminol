#!/usr/bin/env node

import open from 'open';
import yargs from 'yargs';
import { resolve, extname } from 'path';
import interpret from 'interpret';
import { createServer } from '../lib';

const argv = yargs
  .option('client', {
    alias: 'c',
    description: 'Path to client webpack configuration',
    requiresArg: true,
    type: 'string',
  })
  .option('server', {
    alias: 's',
    description: 'Path to server webpack configuration',
    requiresArg: true,
    type: 'string',
  })
  .option('hot', {
    alias: 'H',
    default: true,
    description: 'Enable hot-reload.',
    type: 'boolean',
  })
  .argv;

function registerCompiler(moduleDescriptor) {
  if (moduleDescriptor) {
    if (typeof moduleDescriptor === 'string') {
      require(moduleDescriptor);
    } else if (!Array.isArray(moduleDescriptor)) {
      moduleDescriptor.register(require(moduleDescriptor.module));
    } else {
      for (let i = 0; i < moduleDescriptor.length; i++) {
        try {
          registerCompiler(moduleDescriptor[i]);
          break;
        } catch (e) {
          // do nothing
        }
      }
    }
  }
}

function load(entry) {
  const extensions = Object.keys(interpret.extensions).sort(function(a, b) {
    return a.length - b.length;
  });
  const configPath = resolve(entry);
  let ext;
  for (let i = extensions.length - 1; i >= 0; i--) {
    const tmpExt = extensions[i];
    if (configPath.indexOf(tmpExt, configPath.length - tmpExt.length) > -1) {
      ext = tmpExt;
      break;
    }
  }
  if (!ext) {
    ext = extname(configPath);
  }
  registerCompiler(interpret.extensions[ext]);
  const value = require(configPath);
  if (value && value.__esModule) {
    return value.default;
  }
  return value;
}

global.__IN_DEV_SERVER = true;
process.env.HOT = argv.hot;

const server = createServer({
  client: load(argv.client),
  server: load(argv.server),
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
