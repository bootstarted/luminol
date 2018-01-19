/* @flow */
import {compose, curry, assocPath, path, identity} from 'ramda';
import {entry, plugin} from 'webpack-partial';
import {HotModuleReplacementPlugin, DefinePlugin} from 'webpack';

import runtime from '/runtime';

const isDirectory = (path) => {
  return path.charAt(path.length - 1) === '/';
};

const createToken = () => Math.random().toString(36).substr(2);

// https://github.com/webpack/webpack/blob
// /1b9e880f388f49bc88b52d5a6bbab5538d4c311e
// /lib/JsonpMainTemplate.runtime.js#L27
const getPublicPath = (config) => {
  const existing = path(['output', 'publicPath'], config);
  if (!existing) {
    return '/';
  } else if (!isDirectory(existing)) {
    return `${existing}/`;
  }
  return existing;
};

const fixPublicPath = (config) => {
  return assocPath(['output', 'publicPath'], getPublicPath(config), config);
};

const assignName = (config) => {
  const name = path(['name'], config) || createToken();
  return compose(
    plugin(
      new DefinePlugin({
        __webpack_dev_token__: JSON.stringify(name),
      })
    ),
    assocPath(['name'], name),
  )(config);
};

const withHot = (config) => {
  const hasHMR = (config.plugins || []).some((x) => {
    return x instanceof HotModuleReplacementPlugin;
  });
  if (hasHMR) {
    return config;
  }
  return plugin(new HotModuleReplacementPlugin(), config);
};

const withRuntime = curry((hub, config) => {
  const value = runtime({
    name: config.name,
    target: config.target || 'web',
    hub,
  });
  return entry((previous) => {
    if (!previous.length) {
      throw new TypeError('Must have a valid `entry`.');
    }
    const last = previous.length - 1;
    return previous.slice(0, last).concat(value).concat([previous[last]]);
  }, config);
});

type Options = {
  hubUrl: string,
  hot?: boolean,
};

const createConfig = curry(({hubUrl, hot = true}: Options, config) => compose(
  withRuntime(hubUrl),
  hot ? withHot : identity,
  assignName,
  fixPublicPath,
)(config));

export default createConfig;
