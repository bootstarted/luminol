// @flow
import http from 'http';
import {createClient} from '/hub';
import createRuntime from './createRuntime';
import {proxySet} from '/action/proxy';
import {parseResourceQuery} from './util';
import createLogger from './createLogger';

declare var __webpack_public_path__: string;
declare var __resourceQuery: string;

const listen = http.Server.prototype.listen;

const {hubUrl, name} = parseResourceQuery(__resourceQuery);

const hub = createClient(hubUrl);
global.__webpack_udev_hub__ = hub;

const getProxyPath = (): string => {
  if (
    typeof process.env.WEBPACK_UDEV_PROXY_PATH !== 'string' ||
    process.env.WEBPACK_UDEV_PROXY_PATH.length <= 0
  ) {
    console.log('⚠️  Node service proxy path set to `/`.');
    console.log('⚠️  Please set `devServer.publicPath` in your config.');
    return '/';
  }
  return process.env.WEBPACK_UDEV_PROXY_PATH;
};

// Hack the HTTP server prototype to send address information upstream.
// $ExpectError: TODO: Fix flow ignoring this.
http.Server.prototype.listen = function() {
  const _this = this;
  this.once('listening', () => {
    const address = _this.address();
    const path = getProxyPath();
    hub.dispatch(proxySet({
      url: `http://localhost:${address.port}${path}`,
      path,
    }));
  });
  listen.apply(this, arguments);
};

const internalHub = createRuntime({
  name,
  hub,
  reload() {
    console.log('🔥  Requested full reload. Killing app.');
    process.exit(218);
  },
});

createLogger(internalHub);
