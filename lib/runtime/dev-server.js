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
