/* @flow */
import type {
  Hub,
  Action,
  SubscribeCallback,
  ProvideCallback,
  Unsubscribe,
  Demand,
} from '../types';

const createDemand = (hub: Hub): Demand => {
  let ids = 0;

  const demand = (input: Action, fn: SubscribeCallback): Unsubscribe => {
    const action = {
      type: `DEMAND/${input.type}`,
      payload: input,
      meta: {
        id: ++ids,
      },
    };
    const unsubR = hub.subscribe(`REPLY/${action.meta.id}`, ({payload}) => {
      if (!payload) {
        // TODO: Error validation here.
        return;
      }
      fn(payload);
    });
    const unsubP = hub.subscribe(`PROVIDE/${input.type}`, () => {
      hub.dispatch(action);
    });
    hub.dispatch(action);
    return () => {
      unsubR();
      unsubP();
    };
  };

  const provide = (type: string, fn: ProvideCallback): Unsubscribe => {
    if (typeof fn !== 'function') {
      throw new TypeError();
    }
    const unsub = hub.subscribe(`DEMAND/${type}`, ({payload, meta}) => {
      if (!meta || !meta.id || !payload) {
        // TODO: Error logging here.
        return;
      }
      const id = meta.id;
      const reply = (nextPayload: Action) => {
        hub.dispatch({
          type: `REPLY/${id}`,
          meta: {id},
          payload: nextPayload,
        });
      };
      fn(payload, reply);
    });
    hub.dispatch({
      type: `PROVIDE/${type}`,
    });
    return unsub;
  };

  return {
    demand,
    provide,
  };
};

export default createDemand;
