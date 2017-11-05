import http from 'http';
import {fork} from 'child_process';
import {join} from 'path';
import {watch} from 'chokidar';
import {NodeAdapter as Faye} from 'faye';
import url from 'url';
import consoleLog from './console';
import {
  compose,
  proxy,
  match,
  request,
  connect,
  next,
  status,
  send,
} from 'midori';
import {path} from 'midori/match';

import matches from 'lodash/matches';
import reject from 'lodash/reject';
import unionBy from 'lodash/fp/unionBy';

import {killOnExit, kill} from './util';

export default class Server extends http.Server {
  constructor(configs, {proxies = []} = {}) {
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
      request(() => proxyApp),
      pending(),
    );
    const app = createApp();

    this.compilers = {};
    this.watchers = {};
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

    this.bayeux = new Faye({
      mount: '/__webpack_udev_socket',
      timeout: 45,
      ping: 30,
    });
    this.bayeux.attach(this);
    this.ipc = this.bayeux.getClient();

    consoleLog(this.ipc);

    this.ipc.subscribe('/webpack/endpoint/*', (options) => {
      this.proxy(options);
    });

    this.ipc.subscribe('/webpack/dependencies/*', (deps) => {
      console.log('GOT DEPS!', deps);
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
    this.ipc.publish('/server/proxy/set', result);
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
    this.ipc.publish('/server/config/load', config);
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
    this.ipc.publish('/server/config/unload', config);
    kill(this.compilers[config]);
    delete this.compilers[config];
  }
}
