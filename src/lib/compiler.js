#!/usr/bin/env node
import yargs from 'yargs';
import webpack from 'webpack';
import {entry, plugin} from 'webpack-partial';
import runtime from './runtime';
import {join} from 'path';

import load from './load';
import ipc from './ipc';
import {updateStats} from './util';

import web from './platform/web';
import node from './platform/node';

const token = Math.random().toString(36).substr(2);
const argv = yargs
  .option('config', {
    description: 'Config file to load',
    type: 'string',
  })
  .argv;

const base = {
  output: {},
  plugins: [],
};

const file = argv.config;
const modulesBefore = Object.keys(require.cache).reduce((r, x) => {
  r[x] = true;
  return r;
}, {});
const config = {...base, ...load(file)};
const modulesAfter = Object.keys(require.cache);
const usedModules = modulesAfter.filter((x) => {
  return !modulesBefore[x];
});

const isDirectory = (path) => {
  return path.charAt(path.length - 1) === '/';
};

// https://github.com/webpack/webpack/blob
// /1b9e880f388f49bc88b52d5a6bbab5538d4c311e
// /lib/JsonpMainTemplate.runtime.js#L27
if (!config.output.publicPath) {
  config.output.publicPath = '/';
} else if (!isDirectory(config.output.publicPath)) {
  config.output.publicPath += '/';
}

Object.defineProperty(config, 'token', {
  value: token,
  enumerable: false,
});
config.plugins.push(new webpack.DefinePlugin({
  __webpack_dev_token__: JSON.stringify(token),
  'process.env.IPC_URL': JSON.stringify(process.env.IPC_URL),
}));

const withHot = (config) => {
  const hasHMR = (config.plugins || []).some((x) => {
    return x instanceof webpack.HotModuleReplacementPlugin;
  });
  if (hasHMR) {
    return config;
  }
  return plugin(new webpack.HotModuleReplacementPlugin(), config);
};

const withRuntime = (config) => {
  const value = runtime({target: config.target || 'web'});
  return entry((previous) => {
    const last = previous.length - 1;
    return previous.slice(0, last).concat(value).concat([previous[last]]);
  }, config);
};

const finalConfig = withHot(withRuntime(config));
const compiler = webpack(finalConfig);
compiler.token = token;

web(compiler);
node(compiler);

ipc.publish(`/webpack/config/${token}`, finalConfig);
ipc.publish(`/webpack/dependencies/${token}`, usedModules);
ipc.publish(`/webpack/file/${token}`, {file, token});

compiler.plugin('compile', () => {
  ipc.publish(`/webpack/compile/${token}`, {token});
});

compiler.plugin('invalid', () => {
  ipc.publish(`/webpack/invalid/${token}`, {token});
});

let previous;
compiler.watch({ }, (err, stats) => {
  if (err) {
    err.token = token;
    ipc.publish(`/webpack/error/${token}`, err);
    process.exit(231);
    return;
  }
  const data = stats.toJson();
  data.token = token;
  data.outputPath = compiler.outputPath;
  const result =  previous ? updateStats(previous, data) : data;
  previous = result;
  ipc.publish(`/webpack/stats/${token}`, result);
  result.assets.forEach((asset) => {
    if (!asset.old) {
      const path = join(compiler.outputPath, asset.name);
      ipc.publish(`/file/stats${path}`, result);
    }
  });
});
