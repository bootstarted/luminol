// @flow
import {combineReducers} from 'redux';
import {union, difference} from 'ramda';

import {
  CONFIG_LOADED,
  CONFIG_UNLOADED,
} from '/action/types';

export default combineReducers({
  configs: (state = [], {type, payload}) => {
    switch (type) {
    case CONFIG_LOADED:
      return union([payload.config], state);
    case CONFIG_UNLOADED:
      return difference(state, [payload.config]);
    default:
      return state;
    }
  },
});

export const actions = [CONFIG_LOADED, CONFIG_UNLOADED];
