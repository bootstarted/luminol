// @flow
import {WEBPACK_STATS, WEBPACK_COMPILER_INVALID} from '/action/types';
import TimeoutError from '/internal/error/TimeoutError';
import EventEmitter from 'events';

import type {Hub, WebpackStats} from '/types';

type Options = {
  hub: Hub,
};

type GetStatsOptions = {
  timeout?: number,
};

const createClient = ({
  hub = global.__webpack_udev_hub__,
}: Options = {}) => {
  const stats = {};
  const ev = new EventEmitter();
  const unsub = [];
  unsub.push(hub.subscribe(WEBPACK_STATS, ({payload, meta}) => {
    if (
      meta
      && (typeof meta.name === 'string')
    ) {
      stats[meta.name] = payload;
      // TODO: FIXME: Fix this!
      // $ExpectError
      ev.emit(meta.name, payload);
    }
  }));
  unsub.push(hub.subscribe(WEBPACK_COMPILER_INVALID, ({meta}) => {
    if (meta && (typeof meta.name === 'string')) {
      stats[meta.name] = null;
    }
  }));

  return {
    getStats: (name: string, {
      timeout = 10000,
    }: GetStatsOptions = {}): Promise<WebpackStats> => {
      if (stats[name]) {
        return Promise.resolve(stats[name]);
      }
      return new Promise((resolve, reject) => {
        const timeoutInstance = setTimeout(() => {
          reject(new TimeoutError(`Timeout waiting for stats of ${name}.`));
        }, timeout);
        ev.once(name, (stats) => {
          timeoutInstance && clearTimeout(timeoutInstance);
          resolve(stats);
        });
      });
    },
    close: () => {
      unsub.forEach((x) => x());
    },
  };
};

export default createClient;
