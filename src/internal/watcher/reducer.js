/* @flow */
import {combineReducers} from 'redux';
import {union, difference} from 'ramda';

import {
  PATH_WATCHED,
  PATH_UNWATCHED,
} from '/action/types';

export default combineReducers({
  paths: (state = [], {type, payload}) => {
    switch (type) {
    case PATH_WATCHED:
      return union([payload.path], state);
    case PATH_UNWATCHED:
      return difference(state, [payload.path]);
    default:
      return state;
    }
  },
});

export const actions = [PATH_WATCHED, PATH_UNWATCHED];
