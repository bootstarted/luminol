import http from 'http';
import ipc from '../ipc';
import path from 'path';
import {lookup} from 'mime-types';
import {
  compose,
  send,
  status,
  header,
  connect,
  request,
  next,
} from 'midori';

import MemoryFileSystem from 'memory-fs';

const supportedTargets = ['web', 'webworker'];

export default (compiler) => {
  if (supportedTargets.indexOf(compiler.options.target) === -1) {
    return;
  }

  const server = http.createServer();
  const fs = compiler.outputFileSystem = new MemoryFileSystem();

  if (!compiler.options.output.publicPath) {
    compiler.options.output.publicPath = Math.random().toString(36).substr(2);
  }

  const publicPath = compiler.options.output.publicPath;

  compiler.plugin('compile', () => {
    ipc.publish(`/webpack/endpoint/${compiler.token}`, {
      path: publicPath,
      token: compiler.token,
    });
  });

  compiler.plugin('done', () => {
    const address = server.address();
    ipc.publish(`/webpack/endpoint/${compiler.token}`, {
      url: `http://localhost:${address.port}${publicPath}`,
      path: publicPath,
      token: compiler.token,
    });
  });

  const createApp = request((req) => {
    const b = req.url.substr(publicPath.length);
    const file = path.join(compiler.outputPath, b);
    if (fs.existsSync(file)) {
      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        return compose(
          status(200),
          send(''),
        );
      }
      const data = fs.readFileSync(file);
      return compose(
        status(200),
        header('Content-Type', lookup(b)),
        send(data),
      );
    }
    return next;
  });
  const app = createApp();

  connect(app, server).listen();
};
