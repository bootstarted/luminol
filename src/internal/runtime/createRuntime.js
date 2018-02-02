// @flow
import {unaccepted} from './util';
import {
  WEBPACK_STATS,
  APP_UPDATE_CHECK_FAILED,
  APP_UPDATE_APPLIED,
  APP_ALREADY_UPDATED,
  APP_UPDATE_APPLY_FAILED,
  APP_ERRORS_DETECTED,
  APP_UPDATE_STARTED,
  APP_MODULES_UNACCEPTED,
} from '/action/types';

import type {Hub} from '/hub/types';
import type {WebpackStats} from '/types';
import createHub from '/hub/internal/createHub';

const ok = (stats: WebpackStats) => {
  return (!stats.errors || stats.errors.length === 0);
};

type Options = {
  name: string,
  hub: Hub,
  reload: () => void,
}

declare var module: {
  hot: {
    accept(callback: () => void): void,
    check(
      callback?: (err: ?Error, updates: Array<*>) => void
    ): Promise<*>,
    apply(
      opts: *,
      callback?: (err: ?Error, result: *) => void): Promise<*>,
    status(): string,
  },
};

declare var __webpack_hash__: string;

const checkz = (): Promise<Array<*>> => {
  if (!module.hot) {
    return Promise.resolve([]);
  }
  // webpack 2+
  if (module.hot.check.length === 1) {
    return module.hot.check();
  }
  // webpack 1
  return new Promise((resolve, reject) => {
    module.hot.check(
      (err, updates) => err ? reject(err) : resolve(updates)
    );
  });
};

const applyz = (opts) => {
  // webpack 2+
  if (module.hot.apply.length === 1) {
    return module.hot.apply(opts);
  }
  // webpack 1
  return new Promise((resolve, reject) => {
    module.hot.apply(opts, (err, result) =>
      err ? reject(err) : resolve(result)
    );
  });
};

export default ({reload, hub, name}: Options) => {
  let lastHash = '';
  let lastStats: ?WebpackStats = null;
  const internalHub = createHub();

  const upToDate = () => lastHash.indexOf(__webpack_hash__) >= 0;

  const getModule = (id: string) => {
    if (lastStats && lastStats.modules && lastStats.modules[id]) {
      return lastStats.modules[id].name;
    }
    return `module[${id}]`;
  };

  const check = () => {
    checkz().then((updatedModules) => {
      if (!updatedModules) {
        internalHub.dispatch({type: APP_UPDATE_CHECK_FAILED});
        reload();
        return;
      }
      applyz({
        ignoreUnaccepted: true,
      }).then((renewedModules) => {
        if (!upToDate()) {
          check();
        }
        const unacceptedModules = unaccepted(renewedModules, updatedModules);
        if (unacceptedModules.length > 0) {
          internalHub.dispatch({
            type: APP_MODULES_UNACCEPTED,
            payload: unacceptedModules.map(getModule),
          });
          reload();
          return;
        } else if (upToDate()) {
          internalHub.dispatch({type: APP_ALREADY_UPDATED});
        } else {
          internalHub.dispatch({type: APP_UPDATE_APPLIED});
        }
      }).catch((err) => {
        internalHub.dispatch({type: APP_UPDATE_APPLY_FAILED, payload: err});
        reload();
      });
    }).catch(function(err) {
      internalHub.dispatch({type: APP_UPDATE_CHECK_FAILED, payload: err});
    });
  };

  hub.subscribe(WEBPACK_STATS, ({payload: stats, meta}) => {
    if ((typeof stats !== 'object') || !meta || name !== meta.name) {
      return;
    }

    // TODO: FIXME: Make flow happy with this.
    // $ExpectError
    lastStats = (stats: WebpackConfig);

    if (!ok(lastStats)) {
      internalHub.dispatch({type: APP_ERRORS_DETECTED});
      return;
    }

    lastHash = lastStats.hash;
    if (!upToDate()) {
      if (module.hot) {
        if (module.hot.status() === 'idle') {
          internalHub.dispatch({type: APP_UPDATE_STARTED});
          check();
        }
      } else {
        reload();
      }
    } else {
      internalHub.dispatch({type: APP_ALREADY_UPDATED});
    }
  });

  return internalHub;
};
