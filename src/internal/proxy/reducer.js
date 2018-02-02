// @flow
import {unionWith, eqBy, prop} from 'ramda';
import {combineReducers} from 'redux';
import {PROXY_SET} from '/action/types';

export default combineReducers({
  proxies: (state = [], {type, payload}) => {
    switch (type) {
    case PROXY_SET:
      return unionWith(eqBy(prop('path')), [{
        ...payload,
        ready: !!payload.url,
      }], state);
    default:
      return state;
    }
  },
});

export const actions = [PROXY_SET];
