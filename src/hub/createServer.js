// @flow
import {Server} from 'ws';
import createHub from './internal/createHub';
import handleMessage from './internal/handleMessage';

import type {Server as HTTPServer} from 'http';
import type {Pattern, Action} from './types';

type Options = {
  server: HTTPServer,
  path: string,
};

type Handlers = {
  SUBSCRIBE: ({match: Pattern, id: string}) => void,
  UNSUBSCRIBE: ({id: string}) => void,
  ACTION: (a: Action) => void,
};

const createServer = (options: Options) => {
  const wss = new Server(options);
  const hub = createHub();

  // TODO: Better way of assigning this?
  const updateUrl = () => {
    const address = wss._server.address();
    if (!address) {
      return;
    }
    wss.url = `ws://localhost:${address.port}${wss.options.path || ''}`;
  };

  updateUrl();
  wss.on('listening', updateUrl);

  wss.on('connection', (ws) => {
    ws.subs = {};
    const handlers: Handlers = {
      SUBSCRIBE: ({match, id}) => {
        const _unsub = hub.subscribe(match, (next) => {
          let payload = next;
          if (next.meta && (typeof next.meta.replyTo !== 'undefined')) {
            payload = {
              ...next,
              meta: {
                ...next.meta,
                replyTo: id,
              },
            };
          }
          ws.send(JSON.stringify({type: 'ACTION', payload}));
        });
        const unsubscribe = () => {
          delete ws.subs[id];
          _unsub();
        };
        ws.subs[id] = unsubscribe;
        ws.on('close', () => {
          unsubscribe();
        });
        ws.on('error', () => {
          unsubscribe();
        });
      },
      UNSUBSCRIBE: ({id}) => {
        if (ws.subs[id]) {
          ws.subs[id]();
        }
      },
      ACTION: (payload) => {
        hub.dispatch(payload);
      },
    };
    ws.on('message', (data) => {
      handleMessage(handlers, data);
    });
    ws.on('error', (_err) => {
      // TODO: Just ignore errors?
    });
  });

  wss.on('error', (_err) => {
    // TODO: Just ignore errors?
  });

  wss.dispatch = hub.dispatch;
  wss.subscribe = hub.subscribe;
  return wss;
};

export default createServer;
