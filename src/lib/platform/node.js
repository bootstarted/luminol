/* eslint-disable no-use-before-define */
import {fork} from 'child_process';
import Backoff from 'backo';
import path from 'path';
import {kill as _kill} from '../util';
import ipc from '../ipc';

export default (compiler) => {
  if (compiler.options.target !== 'node') {
    return null;
  }

  ipc.emit('proxy', {
    path: compiler.options.output.publicPath,
    token: compiler.token,
  });

  const backoff = new Backoff({min: 0, max: 1000 * 5});
  let child = null;
  let rip = false;
  let stats = null;
  let spawnTimeout = null;

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
    spawnTimeout = setTimeout(() => _spawn(), backoff.duration());
  };

  const _spawn = () => {
    const entries = stats.chunks.filter((chunk) => chunk.entry);
    const env = {
      ...process.env,
      // Make sure apps don't try to steal our port.
      PORT: 0,
    };

    // Only support one entrypoint right now. Maybe support more later.
    if (entries.length !== 1) {
      throw new Error('Must only export 1 entrypoint!');
    }
    const target = path.join(compiler.outputPath, entries[0].files[0]);
    console.log(
      `▶️  Launching ./${path.relative(compiler.options.context, target)}...`
    );
    child = fork(target, [], {env});
    child.once('exit', (code) => {
      if (rip) {
        // events.emit('close');
      } else  if (code === 218) {
        console.log('🆗  Restart via HMR.');
        spawn();
      } else {
        console.log('⚰️  Child died. Waiting for app change.');
        child = null;
      }
    });
    child.once('error', () => {
      console.log('⚰️  Child died. Waiting for app change.');
      child = null;
    });
  };

  process.once('beforeExit', () => {
    rip = true;
    kill();
  });

  compiler.plugin('done', (_stats) => {
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
