#!/usr/bin/env node
import yargs from 'yargs';
import webpack from 'webpack';
import purdy from 'purdy';
import path from 'path';

import load from './load';
import ipc from './ipc';

import web from './platform/web';
import node from './platform/node';

const options = {
  stats: {
    hash: false,
    cached: false,
    cachedAssets: false,
    colors: true,
    modules: false,
    chunks: false,
  },
};

const token = Math.random().toString(36).substr(2);
const argv = yargs
  .argv;

global.__IN_DEV_SERVER = true;

const file = argv._[0];
const config = (() => {
  console.log(`⏳  Loading ${path.basename(file)}...`);
  return load(file);
})();

const isDirectory = (path) => {
  return path.charAt(path.length - 1) === '/';
};

// https://github.com/webpack/webpack/blob
// /1b9e880f388f49bc88b52d5a6bbab5538d4c311e
// /lib/JsonpMainTemplate.runtime.js#L27
if (!config.output.publicPath) {
  config.output.publicPath = '/';
} if (!isDirectory(config.output.publicPath)) {
  config.output.publicPath += '/';
}

config.plugins.push(new webpack.DefinePlugin({
  __webpack_dev_token__: JSON.stringify(token), // eslint-disable-line
  'process.env.IPC_URL': JSON.stringify(process.env.IPC_URL),
}));

const compiler = webpack(config);

web(compiler);
node(compiler);

// TODO: Figure out a better way of doing this.
if (process.env.DUMP_WEBPACK) {
  console.log(`=====> ${path.basename(file)}`);
  console.log(purdy.stringify(config, {
    plain: false,
    indent: 2,
  }));
}

console.log(`🔨  Compiling ${path.basename(file)}...`);
compiler.watch({ }, (err, stats) => {
  if (err) {
    console.error(err);
    process.exit(231);
    return;
  }
  const data = stats.toJson();
  data.file = file;
  data.token = token;
  data.outputPath = compiler.outputPath;
  ipc.emit('stats', data);

  console.log(stats.toString(options.stats));
});
