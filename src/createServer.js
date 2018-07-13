// @flow
import Server from '/internal/Server';

const createServer = (opts: *) => {
  const server = new Server(opts);
  server.start();
  return server;
};

export default createServer;
