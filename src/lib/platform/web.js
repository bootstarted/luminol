import http from 'http';
import ipc from '../ipc';
import compose from 'lodash/flowRight';
import identity from 'lodash/identity';
import keyBy from 'lodash/fp/keyBy';
import path from 'path';
import {lookup} from 'mime-types';
import thunk from 'midori/thunk';
import send from 'midori/send';
import status from 'midori/status';
import match from 'midori/match';
import serve from 'midori/serve';
import verbs from 'midori/match/verbs';
import connect from 'midori/connect';

import MemoryFileSystem from 'memory-fs';

export default (compiler) => {
  if (compiler.options.target !== 'web') {
    return;
  }

  const fs = compiler.outputFileSystem = new MemoryFileSystem();

  if (!compiler.options.output.publicPath) {
    compiler.options.output.publicPath = Math.random().toString(36).substr(2);
  }
  
  const publicPath = compiler.options.output.publicPath;
  
  compiler.plugin('compile', () => {
    ipc.emit('proxy', {
      path: publicPath,
      token: compiler.options.token,
    });
  });

  const server = http.createServer();
  const index = 'index.html';
  const app = compose(
    thunk((app) => {
      let result = app;
      compiler.plugin('done', (stats) => {
        const address = server.address();
        ipc.emit('proxy', {
          url: `http://localhost:${address.port}${publicPath}`,
          path: publicPath,
          token: compiler.options.token,
        });
        const data = stats.toJson();
        const index = keyBy('name', data.assets);
        result = {
          ...app,
          request(req, res) {
            const b = req.url.substr(data.publicPath.length);
            const file = path.join(compiler.outputPath, b);
            if (fs.existsSync(file)) {
              const data = fs.readFileSync(file);
              res.statusCode = 200;
              res.setHeader('Content-Type', lookup(b));
              res.setHeader('Content-Length', data.length);
              res.end(data);
            } else {
              app.request(req, res);
            }
          },
        };
      });
      return () => result;
    }),
    compiler.options.serve ? verbs.get(
      publicPath,
      serve({
        root: compiler.options.serve,
      })
    ) : identity,
    compose(status(404), send())
  )({request() {}, error() {}});

  connect(app, server).listen();
};
