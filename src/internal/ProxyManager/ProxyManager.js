// @flow
import {compose, proxy, use, next, pending, send, serve, request} from 'midori';
import EventEmitter from 'events';
import url from 'url';
import {unionWith, eqBy, prop} from 'ramda';
import gql from 'graphql-tag';

import type {App, ServeOptions, ProxyOptions} from 'midori';
import type {Client} from '/types';

type Proxy = {
  path: string,
  url: string,
  createdAt: number,
};

export type Options = {
  onTimeout?: App,
  timeout?: number,
  proxy?: (a: ProxyOptions) => App,
};

const PROXY_QUERY = gql`
  query Proxies {
    proxies {
      url
      path
      createdAt
    }
  }
`;

const PROXY_SUBSCRIPTION = gql`
  subscription proxies {
    proxyRegistered {
      url
      path
      createdAt
    }
  }
`;

// const PROXY_DEL_SUBSCRIPTION = gql`
//   subscription proxies2 {
//     proxyUnregistered {
//       id
//     }
//   }
// `;

const defaultOnTimeout = send(504, 'Gateway timeout.');

const defaultOptions = {
  onTimeout: defaultOnTimeout,
  timeout: 15000,
  proxy,
  serve,
};

const proxySet = (state = [], proxy) => {
  return unionWith(eqBy(prop('path')), [proxy], state);
};

class ProxyManager {
  events = new EventEmitter();
  client: Client;
  proxyApp: App = next;
  createServeApp: (ServeOptions) => App;
  createProxyApp: (ProxyOptions) => App;
  app: App = request(() => {
    return this.proxyApp;
  });

  constructor(client: Client, _options) {
    const options = {
      ...defaultOptions,
      ..._options,
    };
    this.pendingOptions = {
      onTimeout: options.onTimeout,
      timeout: options.timeout,
    };
    this.client = client;
    this.createProxyApp = options.proxy;
    this.createServeApp = options.serve;

    const query = client.watchQuery({
      query: PROXY_QUERY,
    });
    query.subscribeToMore({
      document: PROXY_SUBSCRIPTION,
      updateQuery: (prev, {subscriptionData}) => {
        if (!subscriptionData.data) {
          return prev;
        }
        return {
          ...prev,
          proxies: proxySet(
            prev.proxies,
            subscriptionData.data.proxyRegistered,
          ),
        };
      },
    });
    query.subscribe({
      next: ({data: {proxies}}) => {
        this.update(proxies || []);
      },
    });

    this.update([]);
  }

  _getPathPriority(item: Proxy) {
    return item.path.replace(/\/$/, '').split('/').length;
  }

  _createProxyHandler(info: Proxy): App {
    if (info.url) {
      const {hostname, port, pathname, protocol} = url.parse(info.url);
      if (protocol === 'http:' || protocol === 'https:') {
        return this.createProxyApp({
          target: {
            host: typeof hostname === 'string' ? hostname : 'localhost',
            port: typeof port === 'string' ? parseInt(port, 10) : 80,
          },
        });
      } else if (protocol === 'file:') {
        return this.createServeApp({
          final: false,
          root: pathname,
        });
      }
      return request(() => {
        throw new Error(`Invalid proxy protocol for ${info.url}`);
      });
    }
    return pending((fn) => {
      const listener = (info) => {
        fn(this._createProxyHandler(info));
      };
      this.events.once(info.path, listener);
      return () => {
        this.events.removeListener(info.path, listener);
      };
    }, this.pendingOptions);
  }

  update(proxies: Array<Proxy>) {
    const parts = proxies
      .slice()
      .sort((a, b) => {
        const x = this._getPathPriority(b) - this._getPathPriority(a);
        if (x === 0) {
          return b.createdAt - a.createdAt;
        }
        return x;
      })
      .map((info) => {
        return use(info.path, this._createProxyHandler(info));
      });
    this.proxyApp = compose(
      ...parts,
      pending((fn) => {
        const listener = (proxyApp) => {
          fn(proxyApp);
        };
        this.events.once('@app', listener);
        return () => {
          this.events.removeListener('@app', listener);
        };
      }, this.pendingOptions),
    );
    proxies.forEach((proxy) => {
      if (proxy.url) {
        this.events.emit(proxy.path, proxy);
      }
    });
    this.events.emit('@app', this.proxyApp);
  }
}

export default ProxyManager;
