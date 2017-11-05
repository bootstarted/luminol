/* @flow */

import type {
  Hub as BaseHub,
  Demand,
} from './hub/types';

type WebpackEntry = string | {[string]: string} | [string];

export type WebpackConfig = {
  name: string,
  entry: WebpackEntry,
  plugins: Array<any>,
};

export type WebpackCompiler = {
  options: {
    name: ?string,
    output: {
      publicPath: string,
    },
  },
  outputPath: string,
  outputFileSystem: Object,
  plugin?: (evt: string, fn: Function) => void,
  hooks?: {[string]: {
    tap: (name: string, fn: Function) => void,
  }}
};

export type WebpackConfigInput = Array<WebpackConfig | string>
  | WebpackConfig
  | string
;

export type WebpackConfigs = Array<WebpackConfig> | WebpackConfig;

export type WebpackStats = {
  assets: Object,
  hash: string,
};

export type Hub = BaseHub & Demand & {
  url: string,
};
