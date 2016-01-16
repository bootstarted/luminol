import Server from './server';
import runtime from './runtime';

export { runtime };

export function createServer(options) {
  return new Server(options);
}
