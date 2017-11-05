/* @flow */
import {Server} from 'ws';
import createHub from './internal/createHub';
import handleMessage from './internal/handleMessage';
import createDemand from './internal/createDemand';
import createNamespace from './internal/createNamespace';

import type {Server as HTTPServer} from 'http';

type Options = {
  server: HTTPServer,
  path: string,
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
    ws.matches = [];
    ws.subs = {};
    const handlers = {
      SUBSCRIBE: ({match, id}) => {
        const _unsub = hub.subscribe(match, (payload) => {
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

  const eventHub = createNamespace(hub, 'event');
  const demandHub = createNamespace(hub, 'demand');
  const demand = createDemand(demandHub);

  wss.dispatch = eventHub.dispatch;
  wss.subscribe = eventHub.subscribe;
  wss.provide = demand.provide;
  wss.demand = demand;
  return wss;
};

export default createServer;
