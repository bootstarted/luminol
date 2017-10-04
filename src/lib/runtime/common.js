/* global __webpack_hash__, __webpack_dev_token__ */
import {unaccepted} from './util';
import ipc from '../ipc';

const ok = (stats) => {
  return (!stats.errors || stats.errors.length === 0);
};

export default ({reload}) => {
  let lastHash = '';
  let lastStats = null;
  const upToDate = () => lastHash.indexOf(__webpack_hash__) >= 0;

  const getModule = (id) => {
    if (lastStats && lastStats.modules && lastStats.modules[id]) {
      return lastStats.modules[id].name;
    }
    return `module[${id}]`;
  };

  const checkz = () => {
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
    if (module.hot.apply.length === 1) {
      return module.hot.apply(opts);
    }
    return new Promise((resolve, reject) => {
      module.hot.apply(opts, (err, result) =>
        err ? reject(err) : resolve(result)
      );
    });
  };

  const printUnaccepted = (unacceptedModules) => {
    if (unacceptedModules.length > 0) {
      console.log(
        unacceptedModules.map((id) => {
          return ` 🚫  ${getModule(id)}`;
        }).join('\n')
      );
    }
  };

  const check = () => {
    checkz().then(function(updatedModules) {
      if (!updatedModules) {
        console.warn('🔥  Cannot find update. Need to do a full reload!');
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
          console.log('🔥  Unable to hot reload modules:');
          printUnaccepted(unacceptedModules);
          reload();
        } else {
          console.log('🔥  Update applied.');
        }
        if (upToDate()) {
          console.log('🔥  App is up to date.');
        }
      }).catch((err) => {
        console.error('🔥  Update application failed.');
        console.error(err);
        reload();
      });
    }).catch(function(err) {
      console.error('🔥  Update check failed.');
      console.error(err);
    });
  };

  // Monitor our own stats for changes. Other services may call `watch` for
  // things they are interested in.
  ipc.emit('watch', __webpack_dev_token__);

  ipc.on('compile', ({token}) => {
    // Ignore everything but the update we want. Other stats may end up
    // getting sent to this app for other reasons.
    if (token !== __webpack_dev_token__) { // eslint-disable-line
      return;
    }
    console.log('🔥  Compilation in progress.');
  });

  ipc.on('stats', (stats) => {
    // Ignore everything but the update we want. Other stats may end up
    // getting sent to this app for other reasons.
    if (stats.token !== __webpack_dev_token__) { // eslint-disable-line
      return;
    }

    lastStats = stats;

    if (!ok(stats)) {
      console.log('🔥  Errors in build – refusing to reload.');
      return;
    }

    lastHash = stats.hash;
    if (!upToDate()) {
      if (module.hot) {
        if (module.hot.status() === 'idle') {
          console.log('🔥  Checking for updates...');
          check();
        }
      } else {
        reload();
      }
    } else {
      console.log('🔥  Up-to-date!');
    }
  });
};
