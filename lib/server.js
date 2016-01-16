import Proxy from 'http-proxy';
import http from 'http';
import createAssetServer from './assets';
import createRenderServer from './renderer';

const options = {
  stats: {
    hash: false,
    cached: false,
    cachedAssets: false,
    colors: true,
    modules: false,
    chunks: false,
  },
};

function verify(config) {
  if (!config) {
    return false;
  } else if (Array.isArray(config)) {
    return config.some(verify);
  } else if (typeof config === 'object') {
    return Object.keys(config).map(key => config[key]).some(verify);
  } else if (typeof config === 'string') {
    return /webpack-udev-server/.test(config);
  }
  return false;
}

function check(config) {
  if (!verify(config)) {
    throw new TypeError('You must include the `webpack-udev-server` runtime.');
  }
}

export default class Server extends http.Server {
  constructor({ client, server }) {
    super();

    check(client);
    check(server);

    // Set some sane asset path.
    client.output.publicPath = '/_assets';

    // Create the servers.
    this.assets = createAssetServer(client, options);
    this.renderer = createRenderServer(server, options);
    this.proxy = Proxy.createProxy({ ws: true });
    this.ready = false;
    this.state = { };

    // Inform the renderer where the assets are.
    this.renderer.assets(client.output.publicPath);

    // Forward normal requests.
    this.on('request', this.guard((req, res) => {
      this.proxy.web(req, res, {
        target: this.target('http', req),
      });
    }));

    // Forward web sockets.
    this.on('upgrade', this.guard((req, socket, head) => {
      this.proxy.ws(req, socket, head, {
        target: this.target('ws', req),
      });
    }));
  }

  listen() {
    // TODO: Handle error events from renderer/assets
    this.renderer.once('listening', () => this.set('renderer', true));
    this.assets.once('listening', () => this.set('assets', true));

    this.assets.on('stats', stats => {
      this.renderer.stats(stats);
    });

    this.assets.listen(0, 'localhost');
    this.renderer.listen(0, 'localhost');
    http.Server.prototype.listen.apply(this, arguments);
  }

  close() {
    this.assets.close();
    this.renderer.close();
    http.Server.prototype.close.apply(this, arguments);
  }

  target(proto, req) {
    if (req.url.substring(0, '/_assets'.length) === '/_assets') {
      return `${proto}://localhost:${this.assets.address().port}`;
    }
    return `${proto}://localhost:${this.renderer.address().port}`;
  }

  set(type, value) {
    this.state[type] = value;
    this.ready = this.state.assets && this.state.renderer;
    if (this.ready) {
      this.emit('ready');
    }
  }

  guard(fn) {
    return (...args) => {
      if (this.ready) {
        fn(...args);
      } else {
        this.once('ready', () => fn(...args));
      }
    };
  }
}
