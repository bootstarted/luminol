// @flow
import {
  WEBPACK_COMPILER_INVALID,
  WEBPACK_COMPILER_COMPILING,
  WEBPACK_STATS,
  WEBPACK_ERROR,
  APP_PROCESS_CRASHED,
  APP_PROCESS_RESTARTED,
  APP_PROCESS_STARTED,
} from './types';

import type {WebpackStats} from '/types';

// TODO: Make this better.
type Meta = {
  [string]: *
};

export const webpackCompilerInvalid = (meta?: Meta) => ({
  type: WEBPACK_COMPILER_INVALID,
  meta,
});

export const webpackCompilerCompiling = () => ({
  type: WEBPACK_COMPILER_COMPILING,
});

export const webpackCompilerStatsGenerated = (
  stats: WebpackStats,
  meta?: Meta
) => {
  return {
    type: WEBPACK_STATS,
    payload: stats,
    meta,
  };
};

export const webpackCompilerError = (error: Error) => ({
  type: WEBPACK_ERROR,
  payload: error,
});

export const appProcessStarted = (file: string) => ({
  type: APP_PROCESS_STARTED,
  payload: {file},
});

export const appProcessRestarted = () => ({
  type: APP_PROCESS_RESTARTED,
});

export const appProcessCrashed = () => ({
  type: APP_PROCESS_CRASHED,
});
