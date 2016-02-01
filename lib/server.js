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

import {kill} from './util';

export default class Server extends http.Server {
  constructor(configs, options = {}) {
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
      compose(status(404), send('Hello.'))
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
      socket.on('proxy', (info) => {
        // Add proxy to our internal list of proxies.
        this.proxy({
          url: info.url,
          socket: socket.id,
        });
      });

      // Take the resultant stats from child compilers and broadcast them
      // to everyone else on the IPC network. This is useful for things
      // which depend on having access to someone else stats object like a
      // server knowing the client's stats.
      socket.on('stats', (stats) => {
        this.stats[socket.id] = stats;
        this.ipc.in(`/compiler/${stats.token}`).emit('stats', stats);
        stats.assets.forEach((asset) => {
          const path = join(stats.outputPath, asset.name);
          this.ipc
            .in(`/file${path}`)
            .emit('stats', stats, path);
        });
      });

      // Someone just died.
      socket.on('disconnect', () => {
        this.unproxy({
          socket: socket.id,
        });
        // Delete all their stats.
        delete this.stats[socket.id];
      });

      socket.on('watch-stats', (token) => {
        socket.join(`/compiler/${token}`);
        Object.keys(this.stats).forEach((key) => {
          if (this.stats[key].token === token) {
            socket.emit('stats', this.stats[key]);
          }
        });
      });

      socket.on('unwatch-stats', (token) => {
        socket.leave(`/compiler/${token}`);
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
    if (options.proxies) {
      options.proxies.forEach((proxy) => this.proxy(proxy));
    }
  }

  proxy(options) {
    const parts = url.parse(options.url);
    this.proxies.push({
      target: {
        host: parts.hostname,
        port: parts.port,
      },
      path: parts.pathname,
      ...options,
    });
    console.log(`↔️  ${parts.pathname} => ${options.url}`);
    // Update actual proxy configuration.
    this.emit('proxies', this.proxies);
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
