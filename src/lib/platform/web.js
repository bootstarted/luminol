import http from 'http';
import ipc from '../ipc';
import compose from 'lodash/flowRight';
import path from 'path';

import thunk from 'http-middleware-metalab/middleware/thunk';

import {asset} from 'http-middleware-metalab/middleware/assets';
import send from 'http-middleware-metalab/middleware/send';
import status from 'http-middleware-metalab/middleware/status';
import match from 'http-middleware-metalab/middleware/match';
import connect from 'http-middleware-metalab/adapter/http';

import MemoryFileSystem from 'memory-fs';

export default (compiler) => {
  if (compiler.options.target !== 'web') {
    return;
  }

  const fs = compiler.outputFileSystem = new MemoryFileSystem();

  if (!compiler.options.output.publicPath) {
    compiler.options.output.publicPath = Math.random().toString(36).substr(2);
  }

  const server = http.createServer();
  const index = 'index.html';
  const app = compose(
    thunk((app) => {
      let result = app;
      compiler.plugin('done', (stats) => {
        result = match(asset(stats.toJson(), {index}), (app) => {
          return {
            ...app,
            request(req, res) {
              const file = path.join(compiler.outputPath, req.asset.name);
              const data = fs.readFileSync(file);
              res.statusCode = 200;
              res.setHeader('Content-Type', req.asset.contentType);
              res.setHeader('Content-Length', data.length);
              res.end(data);
            },
          };
        })(app);
      });
      return () => result;
    }),
    compose(send(), status(404))
  )({request() {}, error() {}});

  server.on('listening', () => {
    const address = server.address();
    const path = compiler.options.output.publicPath;
    ipc.emit('proxy', {
      url: `http://localhost:${address.port}${path}`,
    });
  });

  connect(app, server).listen();
};
