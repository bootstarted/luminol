import path from 'path';
import thunk from 'http-middleware-metalab/middleware/thunk';
import {request} from 'http-middleware-metalab/middleware/assets';
import ipc from '../ipc';

/**
 * Middleware for your application that monitors a particular webpack stats
 * object and then attaches information about those stats to the request. The
 * webpack stats object being monitored does not have to exist in the calling
 * process.
 *
 * @param {String} file Path to any file in the build.
 * @returns {Function} Middleware function.
 */
export default (file) => {
  return thunk((app) => {
    let result = app;
    const source = path.resolve(file);

    // Monitor the desired file.
    ipc.emit('watch-file', source);

    // When we get a stats object from the file we care about then update the
    // middleware to attach the relevant asset information.
    ipc.on('stats', (stats, origin) => {
      if (origin === source) {
        result = request(stats)(app);
      }
    });

    return () => result;
  });
};
