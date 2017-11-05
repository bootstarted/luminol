/* @flow */
import {
  compose,
  proxy,
  match,
  next,
  pending,
  status,
  send,
} from 'midori';
import {path} from 'midori/match';
import url from 'url';

import type {AppCreator} from 'midori/types';

type ProxyArguments = {
  target: {
    host: string,
    port: number,
  },
};

type Options = {
  onTimeout: AppCreator,
  timeout: number,
  proxy: ((a: ProxyArguments) => AppCreator),
};

const defaultOnTimeout = compose(
  status(504),
  send('Gateway timeout.'),
);

const defaultOptions = {
  onTimeout: defaultOnTimeout,
  timeout: 15000,
  proxy,
};

/**
 * Do the things. TODO: Describe this.
 * @param {Object} _options The options
 * @returns {Function} App creator.
 */
const createProxy = (_options: ?Options): AppCreator => {
  let proxyApp = next;
  const watches = [];
  const options = {
    ...defaultOptions,
    ..._options,
  };
  const pendingOptions = {
    onTimeout: options.onTimeout,
    timeout: options.timeout,
  };
  const createProxyApp = options.proxy;

  const createProxyHandler = (info) => {
    if (info.url) {
      const {hostname, port, path} = url.parse(info.url);
      if (info.path !== path) {
        // TODO: Warn.
      }
      // TODO: Do something smarter if missing `hostname`
      return createProxyApp({
        target: {
          host: typeof hostname === 'string' ? hostname : 'localhost',
          port: typeof port === 'string' ? parseInt(port, 10) : 80,
        },
      });
    }
    return pending((fn) => {
      watches.push({fn, path: info.path});
    }, pendingOptions);
  };

  const zoop = (item) => {
    return item.path.replace(/\/$/, '').split('/').length;
  };

  const update = (proxies) => {
    const parts = proxies.slice().sort((a, b) => {
      return zoop(b) - zoop(a);
    }).map((info) => {
      return match(path(info.path), createProxyHandler(info));
    });
    if (parts.length === 0) {
      return;
    }
    proxyApp = compose(...parts);
    watches.forEach(({fn, path}) => {
      if (
        !path || proxies.some((proxy) => (proxy.path === path && proxy.ready))
      ) {
        fn(proxyApp);
      }
    });
  };
  const app = pending((fn) => {
    if (proxyApp !== next) {
      fn(proxyApp);
      return;
    }
    watches.push({fn, path: null});
  }, pendingOptions);
  app.update = update;
  return app;
};

export default createProxy;
