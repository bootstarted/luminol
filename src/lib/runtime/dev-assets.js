import {resolve} from 'path';
import thunk from 'midori/thunk';
import ipc from '../ipc';

import compose from 'lodash/fp/compose';
import {readFileSync} from 'fs';
import {dirname} from 'path';
import match from 'midori/match';
import path from 'midori/match/path';
import serve from 'midori/serve';

const assetData = (stats) => {
  const {assets: base, publicPath} = stats;
  const rootPath = publicPath.replace(/\/$/, '');
  const assets = base.map((asset) => ({
    ...asset,
    url: `${rootPath}/${asset.name}`,
  }));
  return (app) => ({
    ...app,
    request: (req, res) => {
      req.assets = assets;
      app.request(req, res);
    },
  });
};

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
    const source = resolve(file);

    // Monitor the desired file.
    ipc.emit('watch-file', source);

    // When we get a stats object from the file we care about then update the
    // middleware to attach the relevant asset information.
    ipc.on('stats', (stats, origin) => {
      if (origin === source) {
        result = assetData(stats)(app);
      }
    });

    return () => result;
  });
};
