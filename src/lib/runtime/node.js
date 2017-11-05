/* global __webpack_public_path__, __webpack_dev_token__ */
import http from 'http';
import ipc from '../ipc';
import runtime from './common';

const listen = http.Server.prototype.listen;

// Expose the token to things in `node_modules` that are listed as externals.
global.__webpack_dev_token__ = __webpack_dev_token__;

// Hack the HTTP server prototype to send address information upstream.
http.Server.prototype.listen = function() {
  const _this = this;
  this.once('listening', () => {
    const address = _this.address();
    const path = __webpack_public_path__ || '/';
    ipc.publish(`/webpack/endpoint/${__webpack_dev_token__}`, {
      url: `http://localhost:${address.port}${path}`,
      path,
      token: __webpack_dev_token__,
    });
  });
  listen.apply(this, arguments);
};

runtime({
  reload() {
    console.log('🔥  Requested full reload. Killing app.');
    process.exit(218);
  },
});
