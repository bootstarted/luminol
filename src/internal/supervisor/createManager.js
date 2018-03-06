// @flow
import {observer, observe} from 'redux-observers'; // eslint-disable-line
import {createStore} from 'redux';
import {difference} from 'ramda';

import createSpawner from './createSpawner';
import reducer, {actions} from './reducer';

import type {Hub} from '/types';
import type {Spawner} from './createSpawner';

const configObserver = (spawner) => observer(
  ({configs}) => configs,
  (_dispatch, current, previous) => {
    const created = difference(current, previous);
    const missing = difference(previous, current);
    missing.forEach((config) => {
      spawner.unload(config);
    });
    created.forEach((config) => {
      spawner.load(config);
    });
  }
);

type Options = {
  spawner: Spawner,
};

/**
 * Manager is the thing that listens to IPC and creates a canonical list of
 * configs. Whenever those configs change the appropriate actions are sent to
 * the spawner which is to either spawn or kill a compiler.
 * @param {Object} hub IPC hub.
 * @param {Object} spawner Spawner.
 * @returns {Object} store
 */
const createManager = (hub: Hub, {
  spawner = createSpawner({hubUrl: hub.url}),
}: Options = {}) => {
  const store = createStore(reducer);
  hub.subscribe(actions, store.dispatch);
  observe(store, [configObserver(spawner)]);
  return {store, spawner};
};

export default createManager;
