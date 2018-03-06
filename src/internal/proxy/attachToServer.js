// @flow
import {observer, observe} from 'redux-observers'; // eslint-disable-line
import {createStore} from 'redux';
import {connect} from 'midori';
import createProxy from './createProxy';
import reducer, {actions} from './reducer';

import type {Hub} from '/hub/types';
import type {Server} from 'http';
import type {Options} from './createProxy';

const proxyObserver = (proxy) => observer(
  ({proxies}) => proxies,
  (_dispatch, current) => {
    proxy.update(current);
  }
);

const attachToServer = (hub: Hub, server: Server, options?: Options) => {
  const proxy = createProxy(options);
  const store = createStore(reducer);
  hub.subscribe(actions, store.dispatch);
  observe(store, [proxyObserver(proxy)]);
  connect(proxy, server);
  return {store};
};

export default attachToServer;
