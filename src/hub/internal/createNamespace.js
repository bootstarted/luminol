/* @flow */
import type {Hub, Action} from '../types';

const createNamespace = (hub: Hub, namespace: string): Hub => {
  return {
    subscribe: (match, fn) => {
      const newMatch = Array.isArray(match) ?
        match.map((m) => `${namespace}/${m}`) : `${namespace}/${match}`;
      return hub.subscribe(newMatch, ({payload}) => {
        // TODO: Fix flow here.
        fn(((payload: any): Action));
      });
    },
    dispatch: (action) => {
      return hub.dispatch({
        type: `${namespace}/${action.type}`,
        payload: action,
      });
    },
  };
};

export default createNamespace;
