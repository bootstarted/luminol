/* @flow */
import {proxySet} from '/action/proxy';
import child_process from 'child_process';
import Backoff from 'backo';
import path from 'path';
import {kill as _kill, killOnExit} from '/internal/util';
import hook from '../hook';
import {
  appProcessStarted,
  appProcessCrashed,
  appProcessRestarted,
} from '/action/compiler';

import type {Hub, WebpackCompiler} from '/types';

const otherStuff2 = (hub: Hub, compiler: WebpackCompiler) => {
  const backoff = new Backoff({min: 0, max: 1000 * 5});
  let child = null;
  let rip = false;
  let stats = null;
  let lastHash = null;
  let spawnTimeout = null;

  if (compiler.options.output.publicPath) {
    hub.dispatch(proxySet({
      path: compiler.options.output.publicPath,
    }));
  }

  const kill = () => {
    if (spawnTimeout) {
      clearTimeout(spawnTimeout);
    }
    if (child) {
      _kill(child);
    }
  };

  const spawn = () => {
    if (spawnTimeout) {
      clearTimeout(spawnTimeout);
    }
    kill();
    spawnTimeout = setTimeout(() => {
      _spawn();
    }, backoff.duration());
  };

  const _spawn = () => {
    if (!stats || stats.errors.length > 0) {
      return;
    }
    // This is half optimization half rescuing the OS from a fork bomb that
    // gets caused via https://github.com/webpack/watchpack/issues/25.
    if (lastHash && lastHash === stats.hash && child) {
      return;
    }
    const entries = stats.chunks.filter((chunk) => chunk.entry);
    const env = {
      ...process.env,
      // Make sure apps don't try to steal our port.
      PORT: 0,
    };
    // Only support one entrypoint right now. Maybe support more later.
    if (entries.length !== 1) {
      // TODO: Report error!
      return;
    }
    const target = path.join(compiler.outputPath, entries[0].files[0]);
    hub.dispatch(appProcessStarted(target));
    try {
      child = child_process.spawn(process.execPath, [target], {
        env,
        stdio: [0, 1, 2],
      });
    } catch (err) {
      hub.dispatch(appProcessCrashed());
      return;
    }
    child.once('exit', (code) => {
      if (rip) {
        // TODO: Something here?
      } else  if (code === 218) {
        hub.dispatch(appProcessRestarted());
        spawn();
      } else {
        child = null;
        hub.dispatch(appProcessCrashed());
      }
    });
    child.once('error', (_error) => {
      hub.dispatch(appProcessCrashed());
      child = null;
    });
  };

  process.once('beforeExit', () => {
    rip = true;
  });
  process.once('exit', () => {
    rip = true;
  });

  killOnExit(child);

  hook(compiler, 'done', (_stats) => {
    lastHash = stats && stats.hash;
    stats = _stats.toJson();
    if (!child) {
      spawn();
    }
  });

  return {
    close() {
      rip = true;
      kill();
    },
  };
};

export default otherStuff2;
