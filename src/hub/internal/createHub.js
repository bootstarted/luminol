// @flow
import type {
  Hub,
  Action,
  SubscribeCallback,
  Unsubscribe,
  Pattern,
} from '../types';

const normalizeMatch = (match: string) => {
  if (typeof match === 'string') {
    return ({type}: Action) => {
      return type === match;
    };
  }
  throw new TypeError('Invalid match pattern.');
};

export const createMatch = (matches: Pattern) => {
  if (!Array.isArray(matches)) {
    return normalizeMatch(matches);
  }
  const entries = matches.map(normalizeMatch);
  return (action: Action) => entries.some((fn) => fn(action));
};

const createHub = (): Hub => {
  const listeners = [];
  let ids = 0;
  return {
    subscribe(pattern: Pattern, listener: SubscribeCallback): Unsubscribe {
      const match = pattern ? createMatch(pattern) : (_) => true;
      const id = ++ids;
      listeners.push({id, listener, match});
      this.dispatch({
        type: '@@hub/subscribe',
        payload: {id, pattern},
      });
      const unsub = () => {
        for (let i = 0; i < listeners.length; ++i) {
          if (listeners[i].id === id) {
            listeners.splice(i, 1);
            return;
          }
        }
      };
      unsub.id = id;
      return unsub;
    },
    dispatch(action: Action) {
      listeners.forEach(({match, listener, id}) => {
        if (match(action)) {
          if (
            !action.meta ||
            (typeof action.meta.replyTo === 'undefined') ||
            action.meta.replyTo === id
          ) {
            listener(action);
          }
        }
      });
    },
  };
};

export default createHub;
