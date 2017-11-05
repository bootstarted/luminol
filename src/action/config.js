/* @flow */
import {
  CONFIG_LOADED,
  CONFIG_UNLOADED,
} from './types';

export const configLoaded = (config: string) => ({
  type: CONFIG_LOADED,
  payload: {config},
});

export const configUnloaded = (config: string) => ({
  type: CONFIG_UNLOADED,
  payload: {config},
});
