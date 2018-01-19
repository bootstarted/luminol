/* @flow */
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

// Hack the HTTP server prototype to send address information upstream.
// $FlowIgnore: TODO: Fix flow ignoring this.
http.Server.prototype.listen = function() {
  const _this = this;
  this.once('listening', () => {
    const address = _this.address();
    const path = __webpack_public_path__ || '/';
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
