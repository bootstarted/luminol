// @flow

import type {
  Hub as BaseHub,
} from './hub/types';
import {
  readFile,
} from 'fs';

type WebpackEntry = string | {[string]: string} | [string];

export type WebpackConfig = {
  name: string,
  target: string,
  entry: WebpackEntry,
  plugins: Array<*>,
};

export type WebpackFileSystem = {
  readFile: typeof readFile,
};

export type WebpackCompiler = {
  options: {
    name: ?string,
    output: {
      publicPath: string,
    },
  },
  outputPath: string,
  outputFileSystem: WebpackFileSystem,
  plugin?: (evt: string, fn: (*) => void) => void,
  hooks?: {[string]: {
    tap: (name: string, fn: (*) => void) => void,
  }}
};

export type WebpackConfigInput = Array<WebpackConfig | string>
  | WebpackConfig
  | string
;

export type WebpackConfigs = Array<WebpackConfig> | WebpackConfig;

export type Asset = {
  name: string,
  chunkName: string,
};

export type Chunk = {
  name: string,
};

export type WebpackStats = {
  assets: Array<Asset>,
  chunks: Array<Chunk>,
  hash: string,
  publicPath: string,
  errors: Array<mixed>,
  modules: {[string]: {name: string}},
  hash: string,
};

export type Hub = BaseHub & {
  url: string,
  close: () => void,
};
