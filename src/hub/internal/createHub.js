/* @flow */
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
  throw new TypeError();
};

export const createMatch = (matches: Pattern) => {
  if (typeof matches === 'function') {
    return matches;
  }
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
      return () => {
        for (let i = 0; i < listeners.length; ++i) {
          if (listeners[i].id === id) {
            listeners.splice(i, 1);
            return;
          }
        }
      };
    },
    dispatch(action: Action) {
      listeners.forEach(({match, listener}) => {
        if (match(action)) {
          listener(action);
        }
      });
    },
  };
};

export default createHub;
