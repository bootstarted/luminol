import keyBy from 'lodash/fp/keyBy';
import filter from 'lodash/fp/filter';
import map from 'lodash/fp/map';
import flow from 'lodash/fp/flow';
import sortBy from 'lodash/fp/sortBy';

export const kill = (child, cb = () => {}) => {
  let timeout = null;
  child.once('exit', () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    cb();
  });
  child.kill('SIGINT');
  timeout = setTimeout(() => {
    child.kill('SIGTERM');
    timeout = null;
  }, 3000);
};

export const updateStats = (previous, next) => {
  const newAssets = keyBy('name', next.assets);
  const oldAssets = flow(
    filter(({name}) => !newAssets[name]),
    map((asset) => ({...asset, old: true}))
  )(previous.assets);
  return {
    ...next,
    assets: sortBy('name', [...oldAssets, ...next.assets]),
  };
};
