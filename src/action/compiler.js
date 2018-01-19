/* @flow */
import {
  WEBPACK_COMPILER_INVALID,
  WEBPACK_COMPILER_COMPILING,
  WEBPACK_STATS,
  WEBPACK_ERROR,
  FILE_CONTENT_REQUEST,
  FILE_CONTENT_REPLY,
  APP_PROCESS_CRASHED,
  APP_PROCESS_RESTARTED,
  APP_PROCESS_STARTED,
} from './types';

import type {WebpackStats} from '/types';

export const webpackCompilerInvalid = (meta: ?Object) => ({
  type: WEBPACK_COMPILER_INVALID,
  meta,
});

export const webpackCompilerCompiling = () => ({
  type: WEBPACK_COMPILER_COMPILING,
});

export const webpackCompilerStatsGenerated = (
  stats: WebpackStats,
  meta: Object
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

export const fileContentRequest = (file: string) => ({
  type: FILE_CONTENT_REQUEST,
  payload: {file},
});

export const fileContentReply = (file: string, data: string) => ({
  type: FILE_CONTENT_REPLY,
  payload: {file, data},
});

export const fileContentError = (error: Error) => ({
  type: FILE_CONTENT_REPLY,
  payload: error,
  error: true,
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
