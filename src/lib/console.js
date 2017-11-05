import {basename} from 'path';
import Stats from 'webpack/lib/Stats';

export default (ipc) => {
  ipc.subscribe('/server/proxy/set', (proxy) => {
    console.log(`↔️  ${proxy.path} => ${proxy.url || '🔄'}`);
  });

  ipc.subscribe('/server/proxy/unset', (proxy) => {
    console.log(`↔️  Removed proxy for ${proxy.path}.`);
  });

  ipc.subscribe('/server/config/load', (config) => {
    console.log('🚀  Launching compiler for', basename(config));
  });

  ipc.subscribe('/server/config/unload', (config) => {
    console.log('☠️  Killing compiler for', basename(config));
  });

  ipc.subscribe('/webpack/compile/*', () => {
    console.log('Compiling...');
  });

  ipc.subscribe('/webpack/stats/*', (stats) => {
    const smallerStats = {
      ...stats,
      modules: null,
      children: null,
      entrypoints: null,
      chunks: null,
    };
    console.log(Stats.jsonToString(smallerStats, true));
  });

  ipc.subscribe('/webpack/error/*', (err) => {
    console.log('Unable to compile.');
    console.log(err);
  });
};
