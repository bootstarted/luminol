import {resolve, join} from 'path';
import ipc from './lib/ipc';

const stats = {};
const tokens = {};

ipc.on('invalid', ({token}) => {
  stats[token] = null;
});

ipc.on('stats', (result) => {
  stats[result.token] = result;
  result.assets.forEach(({name}) => {
    tokens[join(result.outputPath, name)] = result.token;
  });
});

const getStats = (file) => {
  if (tokens[file] && stats[tokens[file]]) {
    return Promise.resolve(stats[tokens[file]]);
  }

  return new Promise((resolve) => {
    const listener = () => {
      if (tokens[file] && stats[tokens[file]]) {
        ipc.off('stats', listener);
        resolve(stats[tokens[file]]);
      }
    };
    ipc.on('stats', listener);
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

  // Monitor the desired file.
  ipc.emit('watch-file', source);

  // When we get a stats object from the file we care about then update the
  // middleware to attach the relevant asset information.
  return {
    poll: () => getStats(source),
  };
};
