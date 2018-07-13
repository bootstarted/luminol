// @flow
import {readFile} from 'fs';
import type ApolloClient from 'apollo-client';

type WebpackEntry = string | {[string]: string} | [string];

export type WebpackConfig = {
  name: string,
  target: string,
  entry: WebpackEntry,
  plugins: Array<*>,
  output: {
    publicPath: string,
  },
  devServer: {[string]: mixed},
};

export type WebpackFileSystem = {
  readFile: typeof readFile,
};

export type WebpackMultiCompiler = {
  compilers: Array<WebpackCompiler>,
  plugin: (evt: string, fn: (*) => void) => void,
  hooks: {
    [string]: {
      tap: (name: string, fn: (*) => void) => void,
    },
  },
};

export type WebpackCompiler = {
  options: WebpackConfig,
  outputPath: string,
  outputFileSystem: WebpackFileSystem,
  plugin: (evt: string, fn: (*) => void) => void,
  hooks: {
    [string]: {
      tap: (name: string, fn: (*) => void) => void,
    },
  },
};

export type WebpackConfigInput =
  | Array<WebpackConfig | string>
  | WebpackConfig
  | string;

export type WebpackConfigs = Array<WebpackConfig> | WebpackConfig;

export type Asset = {
  name: string,
  chunkName: string,
};

export type Chunk = {
  name: string,
};

export type Meta = {
  name: string,
  pid: number,
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

export type WebProxy = {
  path: string,
  url: string,
};

export type Config = {
  id: string,
  path: string,
};

export interface Spawner<T> {
  unload: (T) => void;
  load: (config: Config) => T;
}

// TODO: Determine cache shape
export type Client = ApolloClient<*>;
