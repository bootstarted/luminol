/* global window */
import createClientFactory from './createClient';

export const createClient = createClientFactory(window.WebSocket);

export const createServer = () => {
  throw new TypeError();
};
