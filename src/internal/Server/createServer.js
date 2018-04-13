// @flow
import openport from 'openport';
import http from 'http';

type Options = {
  port?: number,
  http2?: boolean,
  https?: *,
};

const getServer = (options) => {
  // TODO: FIXME: Wait for flow to support `http2`.
  if (options.http2 === true) {
    if (options.https) {
      // $ExpectError
      require('http2').createSecureServer(options.https);
    }
    // $ExpectError
    return require('http2').createServer();
  } else if (options.https) {
    require('https').createServer(options.https);
  }
  return http.createServer();
};

const start = (options): Promise<http.Server> =>
  new Promise((resolve, reject) => {
    const server = getServer(options);
    server.once('error', reject);
    server.listen(options.port, () => {
      resolve(server);
    });
  });

const createServer = (options: Options): Promise<http.Server> => {
  if (typeof options.port === 'number') {
    return start(options);
  } else if (typeof process.env.PORT === 'string' && process.env.PORT !== '') {
    return start({
      ...options,
      port: parseInt(process.env.PORT, 10),
    });
  }
  return new Promise((resolve, reject) => {
    openport.find(
      {
        startingPort: 8080,
        createServer: (port, callback) => {
          createServer({
            ...options,
            port,
          }).then((server) => callback(null, server), callback);
        },
      },
      (err, server) => {
        err ? reject(err) : resolve(server);
      },
    );
  });
};

export default createServer;
