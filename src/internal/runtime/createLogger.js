// @flow
import {
  APP_UPDATE_CHECK_FAILED,
  APP_UPDATE_APPLIED,
  APP_ALREADY_UPDATED,
  APP_UPDATE_APPLY_FAILED,
  APP_ERRORS_DETECTED,
  APP_UPDATE_STARTED,
  APP_MODULES_UNACCEPTED,
} from '/action/types';

import type {Hub} from '/hub/types';

const handlers = {
  [APP_ERRORS_DETECTED]: () => {
    console.log('🔥  Errors in build – refusing to reload.');
  },
  [APP_UPDATE_STARTED]: () => {
    console.log('🔥  Checking for updates...');
  },
  [APP_ALREADY_UPDATED]: () => {
    console.log('🔥  App is up to date.');
  },
  [APP_UPDATE_APPLY_FAILED]: (err) => {
    console.error('🔥  Update application failed.');
    if (err) {
      console.error(err);
    }
  },
  [APP_UPDATE_CHECK_FAILED]: (err) => {
    console.error('🔥  Update check failed.');
    if (err) {
      console.error(err);
    }
  },
  [APP_UPDATE_APPLIED]: () => {
    console.log('🔥  Update applied.');
  },
  [APP_MODULES_UNACCEPTED]: (modules) => {
    console.log('🔥  Unable to hot reload modules:');
    modules.forEach((module) => {
      console.log(` 🚫  ${module}`);
    });
  },
};

export default (ipc: Hub) => {
  ipc.subscribe(Object.keys(handlers), ({type, payload, meta}) => {
    handlers[type](payload, meta);
  });
};
