/* @flow */
import webpack from 'webpack';
import MemoryFileSystem from 'memory-fs';

import createConfig from './createConfig';
import normalizeConfig from './normalizeConfig';
import observeCompiler from './observeCompiler';
import getBaseCompilerWithHub from './getBaseCompilerWithHub';

import web from './web';
import node from './node';

import type {Hub, WebpackConfigInput, WebpackConfigs} from '/types';

const createCompiler = (hub: Hub, input: WebpackConfigInput) => {
  const finalConfig: WebpackConfigs = normalizeConfig(input, (config) => {
    return createConfig({hubUrl: hub.url}, config);
  });
  const compiler = webpack(finalConfig);
  if (finalConfig.target === 'web') {
    compiler.outputFileSystem = new MemoryFileSystem();
  }
  getBaseCompilerWithHub(hub, compiler, (hub, compiler) => {
    observeCompiler(hub, compiler);
    if (finalConfig.target === 'web' || finalConfig.target === 'webworker') {
      // server
      web(hub, compiler);
    } else if (finalConfig.target === 'node') {
      // launch
      node(hub, compiler);
    }
  });

  return compiler;
};

export default createCompiler;
