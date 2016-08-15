import http from 'http';
import {fork} from 'child_process';
import {join, basename} from 'path';
import {watch} from 'chokidar';
import io from 'socket.io';
import url from 'url';

import compose from 'lodash/flowRight';
import matches from 'lodash/matches';
import reject from 'lodash/reject';
import send from 'http-middleware-metalab/middleware/send';
import status from 'http-middleware-metalab/middleware/status';
import proxy from 'http-middleware-metalab/middleware/proxy';
import connect from 'http-middleware-metalab/adapter/http';
import match from 'http-middleware-metalab/middleware/match';
import path from 'http-middleware-metalab/middleware/match/path';
import thunk from 'http-middleware-metalab/middleware/thunk';
import serve from 'http-middleware-metalab/middleware/serve';
import header from 'http-middleware-metalab/middleware/header';
import verbs from 'http-middleware-metalab/middleware/match/verbs';

import {kill, updateStats} from './util';

const xx = () => compose(
  verbs.get('/__webpack_udev', serve({
    root: join(
      __dirname,
      '..',
      'ui',
      'dist'
    ),
  })),
  compose(
    status(302),
    header('Location', '/__webpack_udev/index.html'),
    send('Redirecting to UI.')
  )
);

const yy = () => compose(
  status(404),
  send('webpack-udev-server ready.')
);

export default class Server extends http.Server {
  constructor(configs, {proxies = [], ui = true} = {}) {
    super();

    const app = compose(
      thunk((app) => {
        let result = app;
        this.on('proxies', (proxies) => {
          result = proxies.slice().sort((a, b) => {
            return a.path.split('/').length - b.path.split('/').length;
          }).reduce((result, info) => {
            return match(path(info.path), proxy(info))(result);
          }, app);
        });
        return () => result;
      }),
      ui ? xx() : yy()
    )({
      error(err) {
        // TODO: Once the error handling has been standardized, as per:
        // https://github.com/metalabdesign/http-middleware-metalab/issues/30
        // Do something useful here.
        console.log('ERROR', err);
      },
      request(req, res) {
        console.log('UNREACHABLE', req.url);
        res.end();
      },
    });

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
      socket.on('proxy', ({url, token}) => {
        // Add proxy to our internal list of proxies.
        const proxy = this.proxy({
          url,
          socket: socket.id,
          token,
        });
        this.ipc.in(`/compiler`).emit('proxy', proxy);
        if (proxy.token) {
          this.ipc.in(`/compiler/${proxy.token}`).emit('proxy', proxy);
        }
      });

      socket.on('compile', ({token}) => {
        this.ipc.in(`/compiler`).emit('compile', {token});
        this.ipc.in(`/compiler/${token}`).emit('compile', {token});
      });

      // Take the resultant stats from child compilers and broadcast them
      // to everyone else on the IPC network. This is useful for things
      // which depend on having access to someone else stats object like a
      // server knowing the client's stats.
      socket.on('stats', (stats) => {
        const previous = this.stats[socket.id];
        const result = this.stats[socket.id] = previous ?
          updateStats(previous, stats) : stats;
        this.ipc.in(`/compiler`).emit('stats', result);
        this.ipc.in(`/compiler/${stats.token}`).emit('stats', result);
        result.assets.forEach((asset) => {
          if (!asset.old) {
            const path = join(stats.outputPath, asset.name);
            this.ipc
              .in(`/file${path}`)
              .emit('stats', result, path);
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
          this.ipc.in(`/compiler`).emit('rip', stats.token);
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
            socket.emit('stats', this.stats[key], file);
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
    const parts = url.parse(options.url);
    const result = {
      target: {
        host: parts.hostname,
        port: parts.port,
      },
      path: parts.pathname,
      ...options,
    };
    this.proxies.push(result);
    console.log(`↔️  ${parts.pathname} => ${options.url}`);
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
    const compiler = this.compilers[config] = fork(exe, [config], {
      stdio: 'inherit',
      env: {
        ...process.env,
        IPC_URL: `http://localhost:${address.port}/`,
      },
    });
    return compiler;
  }

  unload(config) {
    console.log('☠️  Killing compiler for', basename(config));
    kill(this.compilers[config]);
    delete this.compilers[config];
  }
}
