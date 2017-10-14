import http from 'http';
import {fork} from 'child_process';
import {join, basename} from 'path';
import {watch} from 'chokidar';
import io from 'socket.io';
import url from 'url';

import {
  compose,
  proxy,
  match,
  serve,
  request,
  connect,
  get,
  next,
  status,
  send,
} from 'midori';
import {path} from 'midori/match';

import matches from 'lodash/matches';
import reject from 'lodash/reject';
import unionBy from 'lodash/fp/unionBy';

import {killOnExit, kill, updateStats} from './util';

const xx = () => get('/__webpack_udev', serve({
  root: join(
    __dirname,
    '..',
    'ui',
    'dist'
  ),
}));

export default class Server extends http.Server {
  constructor(configs, {proxies = [], ui = true} = {}) {
    super();

    let proxyApp = next;

    const pending = (timeout = 10000) => {
      return request(() => new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve(compose(
            status(504),
            send('Gateway timeout.'),
          ));
        }, timeout);
        this.once('proxies', () => {
          clearTimeout(timer);
          resolve(compose(proxyApp, pending()));
        });
      }));
    };

    this.on('proxies', (proxies) => {
      const parts = proxies.slice().sort((a, b) => {
        return b.path.split('/').length - a.path.split('/').length;
      }).map((info) => {
        return match(
          path(info.path),
          info.target ? proxy(info) : pending()
        );
      });
      proxyApp = compose(...parts);
    });

    const createApp = compose(
      ui ? xx() : next,
      request(() => proxyApp),
      pending(),
    );
    const app = createApp();

    this.compilers = {};
    this.configs = configs;
    this.proxies = [];

    this.ready = false;
    this.state = {};
    this.stats = {};

    this.on('listening', () => {
      if (this.watcher) {
        this.watcher.close();
      }
      this.watcher = watch(this.configs);
      this.watcher
        .on('add', (file) => this.load(file))
        .on('change', (file) => this.load(file))
        .on('unlink', (file) => this.unload(file))
        .on('error', (err) => this.emit('error', err));
    });

    this.on('close', () => {
      if (this.watcher) {
        this.watcher.close();
        this.watcher = null;
      }
    });

    connect(app, this);

    // io.listen has to come after the normal app because of how it
    // overwrites the request handlers.
    this.ipc = io.listen(this, {
      // TODO: Don't dominate the / namespace!
      // path: '____',
    });

    this.ipc.on('connection', (socket) => {
      // Since we are essentially just a "smart proxy" we take requests to
      // serve things at a particular URL and do so.
      socket.on('proxy', (options) => {
        // Add proxy to our internal list of proxies.
        const proxy = this.proxy({
          ...options,
          socket: socket.id,
        });
        this.ipc.in('/compiler').emit('proxy', proxy);
        if (proxy.token) {
          this.ipc.in(`/compiler/${proxy.token}`).emit('proxy', proxy);
        }
      });

      socket.on('compile', ({token}) => {
        this.ipc.in('/compiler').emit('compile', {token});
        this.ipc.in(`/compiler/${token}`).emit('compile', {token});
      });

      socket.on('invalid', ({token, file}) => {
        this.ipc.in('/compiler').emit('invalid', {token});
        this.ipc.in(`/compiler/${token}`).emit('invalid', {token});
        this.ipc.in(`/file${file}`).emit('invalid', {token});
      });

      // Take the resultant stats from child compilers and broadcast them
      // to everyone else on the IPC network. This is useful for things
      // which depend on having access to someone else stats object like a
      // server knowing the client's stats.
      socket.on('stats', (stats) => {
        const previous = this.stats[socket.id];
        const result = this.stats[socket.id] = previous ?
          updateStats(previous, stats) : stats;
        this.ipc.in('/compiler').emit('stats', result);
        this.ipc.in(`/compiler/${stats.token}`).emit('stats', result);
        result.assets.forEach((asset) => {
          if (!asset.old) {
            const path = join(stats.outputPath, asset.name);
            this.ipc
              .in(`/file${path}`)
              .emit('stats', result);
          }
        });
      });

      // Someone just died.
      socket.on('disconnect', () => {
        this.unproxy({
          socket: socket.id,
        });
        // Delete all their stats.
        const stats = this.stats[socket.id];
        if (stats) {
          this.ipc.in('/compiler').emit('rip', stats.token);
          this.ipc.in(`/compiler/${stats.token}`).emit('rip', stats.token);
        }
        delete this.stats[socket.id];
      });

      socket.on('watch', (token) => {
        socket.join(token ? `/compiler/${token}` : '/compiler');
        Object.keys(this.stats).forEach((key) => {
          if (!token || this.stats[key].token === token) {
            socket.emit('stats', this.stats[key]);
          }
        });
        this.proxies.forEach((proxy) => {
          if (!token || proxy.token === token) {
            socket.emit('proxy', proxy);
          }
        });
      });

      socket.on('unwatch', (token) => {
        socket.leave(token ? `/compiler/${token}` : '/compiler');
      });

      socket.on('watch-file', (file) => {
        socket.join(`/file${file}`);
        Object.keys(this.stats).forEach((key) => {
          if (this.stats[key].assets.some(({name}) => {
            return join(this.stats[key].outputPath, name) === file;
          })) {
            socket.emit('stats', this.stats[key]);
          }
        });
      });

      socket.on('unwatch-file', (file) => {
        socket.leave(`/file${file}`);
      });
    });

    // Add custom proxies if desired.
    if (proxies) {
      proxies.forEach((proxy) => this.proxy(proxy));
    }
  }

  proxy(options) {
    const parts = options.url && url.parse(options.url);
    const path = options.path || parts.pathname;
    if (!path) {
      console.log('NO PATH 😢');
      return null;
    }
    const result = {
      ...options,
      ...(parts ? {target: {
        host: parts.hostname,
        port: parts.port,
      }} : {}),
      path,
    };
    this.proxies = unionBy(({path}) => path, [result], this.proxies);
    console.log(`↔️  ${result.path} => ${options.url || '🔄'}`);
    // Update actual proxy configuration.
    this.emit('proxies', this.proxies);
    return result;
  }

  unproxy(match) {
    // Delete all their registered proxies.
    this.proxies = reject(this.proxies, matches(match));
    // Update actual proxy configuration.
    this.emit('proxies', this.proxies);
  }

  load(config) {
    if (this.compilers[config]) {
      this.unload(config);
    }
    const address = this.address();
    const exe = join(__dirname, 'compiler.js');
    console.log('🚀  Launching compiler for', basename(config));
    const compiler = this.compilers[config] = fork(exe, ['--config', config], {
      stdio: 'inherit',
      env: {
        ...process.env,
        IPC_URL: `http://localhost:${address.port}/`,
      },
    });
    killOnExit(compiler);
    return compiler;
  }

  unload(config) {
    console.log('☠️  Killing compiler for', basename(config));
    kill(this.compilers[config]);
    delete this.compilers[config];
  }
}
