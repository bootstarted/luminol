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
    token: compiler.options.token,
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
    console.log(`▶️  Launching ${target}...`);
    child = fork(target, [], {env});
    child.once('exit', (code) => {
      if (rip) {
        // events.emit('close');
      } else {
        if (code === 218) {
          console.log('🆗  Restart via HMR.');
        }
        spawn();
      }
    });
    child.once('error', () => {
      if (rip) {
        // events.emit('close');
      } else {
        spawn();
      }
    });
  };

  const spawn = () => {
    if (spawnTimeout) {
      clearTimeout(spawnTimeout);
    }
    kill();
    spawnTimeout = setTimeout(() => _spawn(), backoff.duration());
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
