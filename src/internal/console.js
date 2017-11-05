/* @flow */
import type {Hub} from '/types';

import {basename} from 'path';
import Stats from 'webpack/lib/Stats';
import {
  PROXY_SET,
  CONFIG_LOADED,
  CONFIG_UNLOADED,
  PATH_WATCHED,
  PATH_UNWATCHED,
  WEBPACK_STATS,
  WEBPACK_ERROR,
  WEBPACK_COMPILER_COMPILING,
  APP_PROCESS_STARTED,
  APP_PROCESS_CRASHED,
  APP_PROCESS_RESTARTED,
} from '/action/types';

const handlers = {
  [PROXY_SET]: (proxy) => {
    console.log(`↔️  ${proxy.path} => ${proxy.url || '🔄'}`);
  },
  [CONFIG_LOADED]: ({config}) => {
    console.log('🚀  Launching compiler for', basename(config));
  },
  [CONFIG_UNLOADED]: ({config}) => {
    console.log('☠️  Killing compiler for', basename(config));
  },
  [WEBPACK_STATS]: (stats) => {
    const smallerStats = {
      ...stats,
      modules: null,
      children: null,
      entrypoints: null,
      chunks: null,
      _showErrors: true,
    };
    console.log(Stats.jsonToString(smallerStats, true));
  },
  [WEBPACK_ERROR]: (error) => {
    console.log('Unable to compile.');
    console.log(error);
  },
  [PATH_WATCHED]: ({path}) => {
    console.log(`👀  Watching ${path} for changes.`);
  },
  [PATH_UNWATCHED]: ({path}) => {
    console.log(`🙈  Stopped watching ${path}.`);
  },
  [WEBPACK_COMPILER_COMPILING]: (_, {name}) => {
    console.log(`🛠  Started compiling ${name}.`);
  },
  [APP_PROCESS_CRASHED]: () => {
    console.log('⚰️  App crashed. Waiting for code change.');
  },
  [APP_PROCESS_RESTARTED]: () => {
    console.log('🆗  Restart via HMR.');
  },
  [APP_PROCESS_STARTED]: ({file}) => {
    console.log(`🚀  Launching app process ${basename(file)}.`);
  },
};

export default (hub: Hub) => {
  hub.subscribe(Object.keys(handlers), ({type, payload, meta}) => {
    handlers[type](payload, meta);
  });
};
