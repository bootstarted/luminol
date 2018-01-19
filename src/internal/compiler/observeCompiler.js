/* @flow */
// import {join} from 'path';
import {
  webpackCompilerInvalid,
  webpackCompilerCompiling,
  webpackCompilerError,
  webpackCompilerStatsGenerated,
  fileContentReply,
  fileContentError,
} from '/action/compiler';
import {FILE_CONTENT_REQUEST} from '/action/types';

import hook from './hook';
import readFileFromCompiler from './readFileFromCompiler';

import type {Hub, WebpackCompiler, WebpackStats} from '/types';

/**
 * Handles hooking the webpack compiler.
 * @param {Object} hub Hub.
 * @param {Object} compiler Webpack compiler
 * @param {Array} platforms Platforms
 * @returns {void}
 */
const observeCompiler = (
  hub: Hub,
  compiler: WebpackCompiler
) => {
  let previous: WebpackStats;
  let invalid = false;

  hook(compiler, 'compile', () => {
    hub.dispatch(webpackCompilerCompiling());
  });

  hook(compiler, 'invalid', () => {
    invalid = true;
    hub.dispatch(webpackCompilerInvalid());
  });

  hub.provide(FILE_CONTENT_REQUEST, ({payload}, reply) => {
    if (!payload || !payload.file || invalid) {
      return;
    }
    const {file} = payload;
    readFileFromCompiler(compiler, file).then((data) => {
      reply(fileContentReply(file, data.toString('base64')));
    }, (err) => {
      if (err.code === 'ENOENT') {
        return;
      }
      // TODO: Maybe include file too?
      reply(fileContentError(err));
    });
  });

  hook(compiler, 'done', (stats) => {
    const data: WebpackStats = stats.toJson({
      errorDetails: false,
    });
    // TODO: Why is this event triggered like crazy sometimes?
    // The compiler seems to want to go on a rampage compiling a whole bunch
    // of stuff over and over with the same hash.
    // Seems like this: https://github.com/webpack/watchpack/issues/25
    invalid = false;
    if (previous && previous.hash === data.hash) {
      return;
    }
    previous = data;
    hub.dispatch(webpackCompilerStatsGenerated(data, {}));
  });

  hook(compiler, 'failed', (err) => {
    hub.dispatch(webpackCompilerError(err));
    // TODO: Handle this.
  });
};

export default observeCompiler;
