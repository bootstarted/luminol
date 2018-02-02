// @flow
// import {join} from 'path';
import {
  webpackCompilerInvalid,
  webpackCompilerCompiling,
  webpackCompilerError,
  webpackCompilerStatsGenerated,
} from '/action/compiler';
import {WEBPACK_STATS} from '/action/types';

import hook from './hook';

import type {WebpackCompiler, WebpackStats} from '/types';
import type {Hub} from '/hub/types';

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
  let invalid = true;

  hook(compiler, 'compile', () => {
    hub.dispatch(webpackCompilerCompiling());
  });

  hub.subscribe('@@hub/subscribe', ({payload}) => {
    // TODO: FIXME: Fix this!
    // $ExpectError
    if (payload.pattern === WEBPACK_STATS) {
      if (previous && !invalid) {
        hub.dispatch(webpackCompilerStatsGenerated(previous, {
          // TODO: FIXME: Fix this!
          // $ExpectError
          replyTo: payload.id,
        }));
      }
    }
  });

  hook(compiler, 'invalid', () => {
    invalid = true;
    hub.dispatch(webpackCompilerInvalid());
  });

  hook(compiler, 'done', (stats) => {
    const data: WebpackStats = stats.toJson({
      errorDetails: false,
    });
    // TODO: Why is this event triggered like crazy sometimes?
    // The compiler seems to want to go on a rampage compiling a whole bunch
    // of stuff over and over with the same hash.
    // Seems like this: https://github.com/webpack/watchpack/issues/25
    if (previous && previous.hash === data.hash) {
      return;
    }
    previous = data;
    hub.dispatch(webpackCompilerStatsGenerated(data, {}));
    invalid = false;
  });

  hook(compiler, 'failed', (err) => {
    hub.dispatch(webpackCompilerError(err));
    // TODO: Handle this.
  });
};

export default observeCompiler;
