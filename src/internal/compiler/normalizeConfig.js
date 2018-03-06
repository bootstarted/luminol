// @flow
// TODO: The `import-file` module depends on `rechoir` which has a really hard
// time with extensions. The extension `.webpack.config.babel.js` is not
// recognized as a `.babel.js` file. So either `rechoir` needs to be patched,
// we need to do it ourselves, or we decide just not to support that.
import importFile from 'import-file';
import {identity} from 'ramda';

import type {WebpackConfigInput, WebpackConfig, WebpackConfigs} from '/types';
type ConfigInput = string | WebpackConfig;

const getConfig = (config: ConfigInput): WebpackConfig => {
  if (typeof config === 'object') {
    return config;
  }
  return importFile(config, {
    useFindUp: false,
  });
};

const normalizeConfig = (
  config: ?WebpackConfigInput,
  fn: (x: WebpackConfig) => WebpackConfig = identity,
): WebpackConfigs => {
  if (Array.isArray(config)) {
    if (config.length === 0) {
      throw new TypeError('Invalid webpack config: must not be empty.');
    } else if (config.length === 1) {
      return fn(getConfig(config[0]));
    }
    return config.map((x) => fn(getConfig(x)));
  } else if (
    (typeof config === 'object' && config !== null) ||
    (typeof config === 'string' && config.length > 0)
  ) {
    return fn(getConfig(config));
  }
  throw new TypeError(`Invalid webpack config type: ${typeof config}.`);
};

export default normalizeConfig;
