// @flow
import createHub from './internal/createHub';
import handleMessage from './internal/handleMessage';
import Backoff from 'backo';

import type {Pattern, Action, SubscribeCallback} from './types';

type Handlers = {
  ACTION: (a: Action) => void,
};

const createClient = (WebSocket: Class<WebSocket>) => (url: string) => {
  let ws;
  const queue = [];
  const hub = createHub();

  const backoff = new Backoff({min: 100, max: 10000});

  let closed = false;

  const handlers: Handlers = {
    ACTION: (payload) => {
      hub.dispatch(payload);
    },
  };

  const connect = () => {
    setTimeout(() => {
      _connect();
    }, backoff.duration());
  };

  const _connect = () => {
    if (closed || ws) {
      return;
    }
    ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      // TODO: ws bug here?
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return;
      }
      backoff.reset();
      for (const msg of queue) {
        ws.send(msg);
      }
      queue.length = 0;
    });

    ws.addEventListener('close', () => {
      ws = null;
      if (!closed) {
        connect();
      }
    });

    ws.addEventListener('error', () => {
      ws = null;
      if (!closed) {
        connect();
      }
    });

    ws.addEventListener('message', (message) => {
      // TODO: Fix these flow refinement issues.
      // $ExpectError
      const _message = ((message: any): MessageEvent);
      if (typeof _message.data === 'string') {
        handleMessage(handlers, _message.data);
      }
    });
  };

  _connect();

  const send = (msg) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else {
      queue.push(msg);
    }
  };

  const subscribe = (match: Pattern, listener: SubscribeCallback) => {
    const unsub = hub.subscribe(match, listener);
    const id = unsub.id;
    send(JSON.stringify({
      type: 'SUBSCRIBE',
      payload: {match, id},
    }));
    return () => {
      unsub();
      send(JSON.stringify({
        type: 'UNSUBSCRIBE',
        payload: {id},
      }));
    };
  };

  const dispatch = (action: Action) => {
    send(JSON.stringify({type: 'ACTION', payload: action}));
  };

  const remoteHub = {
    dispatch,
    subscribe,
    url,
  };

  return {
    url,
    close: () => {
      closed = true;
      // TODO: Mechanism for delaying the close until the last action has
      // been flushed.
      setTimeout(() => {
        ws && ws.close();
        ws = null;
      }, 40);
    },
    dispatch: remoteHub.dispatch,
    subscribe: remoteHub.subscribe,
  };
};

export default createClient;
