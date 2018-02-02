// @flow
import WebSocket from 'ws';
import createClientFactory from './createClient';

export {default as createServer} from './createServer';
export const createClient = createClientFactory(WebSocket);
