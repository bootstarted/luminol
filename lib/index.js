import Server from './server';
import runtime from './runtime';

export {runtime};

export const createServer = (configs, options) => {
  return new Server(configs, options);
};
