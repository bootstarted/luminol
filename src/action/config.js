// @flow
import {
  CONFIG_LOADED,
  CONFIG_UNLOADED,
  CONFIG_EMPTY,
} from './types';

export const configLoaded = (config: string) => ({
  type: CONFIG_LOADED,
  payload: {config},
});

export const configUnloaded = (config: string) => ({
  type: CONFIG_UNLOADED,
  payload: {config},
});

export const configEmpty = (paths: Array<string>) => ({
  type: CONFIG_EMPTY,
  payload: {paths},
});
