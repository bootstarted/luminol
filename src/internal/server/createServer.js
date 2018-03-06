// @flow
import openport from 'openport';
import http from 'http';

const start = (port: number): Promise<http.Server> =>
  new Promise((resolve, reject) => {
    const server = http.createServer();
    server.once('error', reject);
    server.listen(port, () => {
      resolve(server);
    });
  });

type Options = {
  port: ?number
};

const createServer = ({port, ...opts}: Options): Promise<http.Server> => {
  if (typeof port === 'number') {
    return start(port);
  } else if (typeof process.env.PORT === 'string' && process.env.PORT !== '') {
    return start(parseInt(process.env.PORT, 10));
  }
  return new Promise((resolve, reject) => {
    openport.find({
      startingPort: 8080,
      createServer: (port, callback) => {
        createServer({port, ...opts})
          .then((server) => callback(null, server), callback);
      },
    }, (err, server) => {
      err ? reject(err) : resolve(server);
    });
  });
};

export default createServer;
