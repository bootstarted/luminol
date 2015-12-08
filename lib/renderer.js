import webpack from 'webpack';
import { fork } from 'child_process';
import EventEmitter from 'events';
import Backoff from 'backo';
import path from 'path';

export default function createRenderServer(renderer, options) {
  const serverCompiler = webpack(renderer);
  const backoff = new Backoff({ min: 0, max: 1000 * 20 });
  const events = new EventEmitter();
  let child = null;
  let addr = null;
  let start = false;
  let rip = false;
  let port = 0;
  let assetStats = null;
  let serverStats = null;
  const hot = true;

  function send() {
    if (child && assetStats) {
      child.send({ type: 'stats', stats: assetStats });
    }
  }

  function kill() {
    if (child) {
      let timeout = null;
      child.once('exit', () => {
        child = null;
        if (timeout) {
          clearTimeout(timeout);
        }
      });
      child.kill('SIGINT');
      timeout = setTimeout(() => {
        child.kill('SIGTERM');
        child = null;
        timeout = null;
      }, 3000);
    }
  }

  function _spawn() {
    const map = serverStats.toJson({ assets: true }).assetsByChunkName;
    const modules = Object.keys(map).map(key => {
      return path.join(renderer.output.path, map[key]);
    });
    const env = {
      ...process.env,
      PORT: port,
      HAS_WEBPACK_ASSET_EVENTS: 1,
    };

    // Only support one entrypoint right now. Maybe support more later.
    if (modules.length !== 1) {
      throw new Error('Must only export 1 entrypoint!');
    }
    child = fork(modules[0], [  ], { env });
    child.on('message', (message) => {
      switch (message.type) {
      case 'ping':
        backoff.reset();
        break;
      case 'address':
        addr = message.address;
        events.emit('listening');
        break;
      default:
        events.emit('error', new Error(`Unknown event: ${message.type}`));
      }
    });
    child.once('exit', () => {
      if (rip) {
        events.emit('close');
      } else {
        spawn();
      }
    });
    child.once('error', () => {
      if (rip) {
        events.emit('close');
      } else {
        spawn();
      }
    });
    send();
  }

  function spawn() {
    setTimeout(_spawn, backoff.duration());
  }

  function reload() {
    if (hot) {
      // If we're already running just invoke HMR, otherwise start up.
      child.kill('SIGUSR2');
    } else {
      kill();
    }
  }

  function trigger() {
    if (!start || !serverStats) {
      return;
    } else if (child) {
      reload();
    } else {
      spawn();
    }
  }

  serverCompiler.watch({ }, (err, _stats) => {
    // Bail on failure.
    if (err) {
      return;
    }
    serverStats = _stats;

    /* eslint no-console: 0 */
    console.log(serverStats.toString(options.stats));
    trigger();
  });

  process.once('beforeExit', () => {
    rip = true;
    kill();
  });

  return Object.assign(events, {
    compiler: serverCompiler,
    close() {
      rip = true;
      kill();
    },
    listen(_port) {
      start = true;
      port = _port;
      trigger();
    },
    address() {
      return addr;
    },
    assets() {
      send();
    },
    stats(_stats) {
      assetStats = _stats.toJson({
        hash: true,
        version: false,
        timings: false,
        assets: false,
        chunks: true,
        chunkModules: false,
        modules: false,
        cached: false,
        reasons: false,
        source: false,
        errorDetails: false,
        chunkOrigins: false,
      });
      send();
    },
  });
}
