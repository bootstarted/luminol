/* global __webpack_public_path__ */
import http from 'http';
import ipc from '../ipc';
import runtime from './common';

const listen = http.Server.prototype.listen;

// Hack the HTTP server prototype to send address information upstream.
http.Server.prototype.listen = function() {
  const _this = this;
  this.once('listening', () => {
    const address = _this.address();
    const path = __webpack_public_path__ || '/'; // eslint-disable-line
    ipc.emit('proxy', {
      url: `http://localhost:${address.port}${path}`,
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
