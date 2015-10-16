
import WebpackDevServer from 'webpack-dev-server';
import webpack from 'webpack';
import EventEmitter from 'events';

const defaults = {
  hot: true,
  inline: true,
  historyApiFallback: false,
  publicPath: '/',
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
};

export default function createAssetServer(assets, options) {
  const events = new EventEmitter();
  const compiler = webpack(assets);
  const server = new WebpackDevServer(compiler, {
    ...defaults,
    ...options
  });

  const emit = server.listeningApp.emit;
  server.listeningApp.emit = (...args) => {
    emit.apply(server.listeningApp, args);
    events.emit.apply(events, args);
  };

  compiler.plugin('done', stats => events.emit('stats', stats));

  return Object.assign(events, {
    compiler,
    listen(...args) {
      server.listen(...args);
    },
    address() {
      return server.listeningApp.address();
    },
    close() {
      server.middleware.watching.close();
      server.listeningApp.close();
    }
  });
}
