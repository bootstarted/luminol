import http from 'http';
const listen = http.Server.prototype.listen;

// Hack the HTTP server prototype to send address information upstream.
http.Server.prototype.listen = function() {
  this.once('listening', function() {
    process.send({ type: 'address', address: this.address() });
  });
  listen.apply(this, arguments);
};

// Proxy message as assets. Maybe one day the transport changes to HTTP
// instead of fork or something... but here we are for now.
process.on('message', function(message) {
  if (message.type === 'stats') {
    process.emit('webpack-stats', message.stats);
  }
});

process.send({ type: 'ping' });

if (module.hot) {
  // TODO: For cases like "The following modules couldn't be hot updated: (They
  // would need a full reload!)" see if we can't figure out how to do the same
  // thing.
  // Just kill the process if we can't update; the server will restart for us.
  module.hot.status((status) => {
    if (status in {abort: 1, fail: 1}) {
      process.exit(101);
    }
  });
}
