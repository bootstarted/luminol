/* @flow */
import {configLoaded, configUnloaded} from '/action/config';
import {watch} from 'chokidar';
import {observer, observe} from 'redux-observers'; // eslint-disable-line
import {createStore} from 'redux';
import {difference} from 'ramda';
import reducer, {actions} from './reducer';

import type {Hub} from '/hub/types';

const watcherObserver = (watcher) => observer(
  ({paths}) => paths,
  (_dispatch, current, previous) => {
    const created = difference(current, previous);
    const missing = difference(previous, current);
    missing.forEach((path) => {
      watcher.unwatch(path);
    });
    created.forEach((path) => {
      watcher.add(path);
    });
  }
);

const createWatcher = (hub: Hub) => {
  const watcher = watch();
  const store = createStore(reducer);
  hub.subscribe(actions, store.dispatch);
  observe(store, [watcherObserver(watcher)]);
  watcher
    .on('add', (file) => hub.dispatch(configLoaded(file)))
    .on('change', (file) => hub.dispatch(configLoaded(file)))
    .on('unlink', (file) => hub.dispatch(configUnloaded(file)))
    .on('error', (_err) => {
      // TODO: Fix error handling.
    });
  return watcher;
};

export default createWatcher;
