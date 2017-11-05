/* @flow */
import {resolve} from 'path';
import {fileContentRequest} from '/action/compiler';

import type {Hub} from '/types';

type PollOptions = {
  timeout?: number
};

type WatcherOptions = {
  hub: Hub
};

/**
 * Create a watcher for the given file. This watcher has a `poll` method that
 * returns a promise that resolves when the file changes, giving the new
 * webpack stats object associated with that file.
 * @param {String} path Path to any file in the build.
 * @returns {Object} Watcher object.
 */
export default (
  path: string,
  {hub = global.__webpack_udev_hub__}: WatcherOptions = {}
) => {
  if (!hub) {
    throw new TypeError('Must provide hub.');
  }
  const file = resolve(path);

  // When we get a stats object from the file we care about then update the
  // middleware to attach the relevant asset information.
  return {
    poll: (options: PollOptions = {timeout: 10000}): Promise<Buffer> => {
      return new Promise((resolve, reject) => {
        const action = fileContentRequest(file);
        let unsub = null;
        const hasTimeout = (typeof options.timeout === 'number') &&
          options.timeout > 0;
        const timeout = hasTimeout ? setTimeout(() => {
          unsub && unsub();
          const error = new Error(`Timeout waiting for ${file}.`);
          // $FlowIgnore: TODO: Make flow happy with this.
          error.timeout = true;
          reject(error);
        }, options.timeout) : null;
        unsub = hub.demand(action, ({payload, error}) => {
          unsub && unsub();
          timeout && clearTimeout(timeout);
          if (error) {
            reject(error);
            return;
          }
          if (!payload || !payload.data) {
            reject(new TypeError());
            return;
          }
          resolve(new Buffer(payload.data, 'base64'));
        });
      });
    },
  };
};
