import Server from './lib/Server';
import runtime from './lib/runtime';

export {runtime};

export const createServer = (configs, options) => {
  return new Server(configs, options);
};
