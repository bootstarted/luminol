import {resolve, join} from 'path';
import ipc from './lib/ipc';

const stats = {};
const tokens = {};

ipc.subscribe('/webpack/invalid/*', ({token}) => {
  stats[token] = null;
});
ipc.subscribe('/webpack/stats/*', (result) => {
  stats[result.token] = result;
  result.assets.forEach(({name}) => {
    tokens[join(result.outputPath, name)] = result.token;
  });
});

const getStats = (file, {timeout = 5000} = {}) => {
  if (tokens[file] && stats[tokens[file]]) {
    return Promise.resolve(stats[tokens[file]]);
  }

  return new Promise((resolve, reject) => {
    let timer;
    let subscription = null;
    if (timeout > 0) {
      setTimeout(() => {
        const error = new Error(`Waiting for stats of '${file}' timed out.`);
        reject(error);
      }, timeout);
    }
    const listener = () => {
      if (tokens[file] && stats[tokens[file]]) {
        if (subscription) {
          subscription.cancel();
        }
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        resolve(stats[tokens[file]]);
      }
    };
    subscription = ipc.subscribe(`/file/stats${file}`, listener);
  });
};

/**
 * Create a watcher for the given file. This watcher has a `poll` method that
 * returns a promise that resolves when the file changes, giving the new webpack
 * stats object associated with that file.
 * @param {String} file Path to any file in the build.
 * @returns {Object} Watcher object.
 */
export default (file) => {
  const source = resolve(file);

  // When we get a stats object from the file we care about then update the
  // middleware to attach the relevant asset information.
  return {
    poll: (options) => getStats(source, options),
  };
};
