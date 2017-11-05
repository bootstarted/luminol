/* @flow */
import {
  PATH_WATCHED,
  PATH_UNWATCHED,
} from './types';

export const pathWatched = (path: string) => ({
  type: PATH_WATCHED,
  payload: {path},
});

export const pathUnwatched = (path: string) => ({
  type: PATH_UNWATCHED,
  payload: {path},
});
