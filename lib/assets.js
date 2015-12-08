import createMiddleware from 'webpack-dev-middleware';
import webpack from 'webpack';
import http from 'http';
import socketio from 'socket.io';

export default function createAssetServer(assets, options) {
  const compiler = webpack(assets);
  const middleware = createMiddleware(compiler, {
    ...options,
    publicPath: assets.output.publicPath,
  });
  const server = http.createServer((req, res) => {
    middleware(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });
  const io = socketio(server, {
    path: `${assets.output.publicPath}/socket.io`,
  });

  let stats = null;

  function ok(stats) {
    return (!stats.errors || stats.errors.length === 0) &&
      stats.assets &&
      stats.assets.every(asset => !asset.emitted);
  }

  function sendStats(socket, force) {
    if (!stats) {
      return;
    } else if (!force && ok(stats)) {
      socket.emit('still-ok');
      return;
    }

    socket.emit('hash', stats.hash);
    if (stats.errors && stats.errors.length > 0) {
      socket.emit('errors', stats.errors);
    } else if (stats.warnings && stats.warnings.length > 0) {
      socket.emit('warnings', stats.warnings);
    } else {
      socket.emit('ok');
    }
  }

  // Socket events.
  io.sockets.on('connection', socket => {
    socket.emit('hot');
    sendStats(socket, true);
  });

  // Compiler events.
  compiler.plugin('compile', () => io.sockets.emit('invalid'));
  compiler.plugin('invalid', () => io.sockets.emit('invalid'));
  compiler.plugin('done', _stats => {
    stats = _stats;
    sendStats(io.sockets);
  });
  compiler.plugin('done', stats => server.emit('stats', stats));

  return Object.assign(server, {
    compiler,
    close() {
      io.close();
      middleware.close();
      http.Server.prototype.close.apply(this, arguments);
    },
  });
}
