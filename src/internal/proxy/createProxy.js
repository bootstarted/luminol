// @flow
import {
  compose,
  proxy,
  use,
  next,
  pending,
  status,
  send,
  request,
} from 'midori';
import EventEmitter from 'events';
import url from 'url';

import type {App} from 'midori';

type ProxyArguments = {
  target: {
    host: string,
    port: number,
  },
};

export type Options = {
  onTimeout?: App,
  timeout?: number,
  proxy?: ((a: ProxyArguments) => App),
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

type Proxy = App & {
  update: (Array<*>) => void,
};

/**
 * Do the things. TODO: Describe this.
 * @param {Object} _options The options
 * @returns {Function} App creator.
 */
const createProxy = (_options: ?Options): Proxy => {
  let proxyApp: App = next;
  const options = {
    ...defaultOptions,
    ..._options,
  };
  const pendingOptions = {
    onTimeout: options.onTimeout,
    timeout: options.timeout,
  };
  const createProxyApp = options.proxy;
  const events = new EventEmitter();

  const createProxyHandler = (info): App => {
    if (info.ready) {
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
      events.once(info.path, (info) => {
        fn(createProxyHandler(info));
      });
    }, pendingOptions);
  };

  const zoop = (item) => {
    return item.path.replace(/\/$/, '').split('/').length;
  };

  const update = (proxies) => {
    const parts = proxies.slice().sort((a, b) => {
      return zoop(b) - zoop(a);
    }).map((info) => {
      return use(info.path, createProxyHandler(info));
    });
    proxyApp = compose(...parts, pending((fn) => {
      events.once('@app', (proxyApp) => {
        fn(proxyApp);
      });
    }, pendingOptions));
    events.emit('@app', proxyApp);
  };
  update([]);
  // TODO: FIXME: Make flow happy here.
  // $ExpectError
  const app: Proxy = request(() => proxyApp);
  app.update = update;
  return app;
};

export default createProxy;
