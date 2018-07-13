// @flow
import createServer from './createServer';
import createClient from '/internal/createClient';
import createDebug from '/internal/createDebug';
import ProxyManager from '/internal/ProxyManager';
import ProcessManager from '/internal/ProcessManager';
import open from 'opn';
import clipboardy from 'clipboardy';
import {
  connect,
  compose,
  next,
  use,
  upgrade,
  apply,
  query,
  body,
  send,
  request,
  halt,
} from 'midori';
import {resolve, basename} from 'path';

import type {Server as HTTPServer} from 'http';
import type {App} from 'midori';
import type {Client} from '/types';

import {SubscriptionServer} from 'subscriptions-transport-ws';
import {execute, subscribe} from 'graphql';
import {runHttpQuery} from 'apollo-server-core';
import {Server as WebSocketServer} from 'ws';

import schema from '/internal/apollo/schema';
import gql from 'graphql-tag';

import handleCors from './handleCors';
import createLogger from './createLogger';
import Context from './Context';

const registerProcess = gql`
  mutation registerProcess($path: String, $args: [String], $title: String) {
    registerProcess(path: $path, args: $args, title: $title) {
      id
    }
  }
`;

const registerProxy = gql`
  mutation registerProxy($url: String, $path: String) {
    registerProxy(url: $url, path: $path) {
      url
      path
    }
  }
`;

const debug = createDebug('server');

export type Options = {
  add?: (app: *, client: Client) => *,
  fork?: boolean,
  require?: Array<string>,
  url?: string,
  log?: boolean,
  hot?: boolean,
  logLevel?: 'trace' | 'info',
  port?: number,
  clipboard?: boolean,
  open?: boolean,
  https?: *,
  http2?: *,
  config?: string | Array<string>,
  content?: string | Array<string>,
};

type AddOptionBase = string | ((x: App, ...rest: Array<*>) => App);
type AddOption = Array<AddOptionBase> | AddOptionBase | void;

const replyGql = (options) =>
  apply(query, body, request, async (qs, body, {method}) => {
    const query = method === 'GET' ? qs : JSON.parse(body.toString('utf8'));
    try {
      const result = await runHttpQuery([], {
        method,
        options,
        query,
      });
      return send(
        200,
        {
          'Content-Type': 'application/json',
        },
        result,
      );
    } catch (error) {
      if (error.name !== 'HttpQueryError') {
        throw error;
      }
      return send(error.statusCode, error.headers, error.message);
    }
  });

class Server {
  port: ?number = null;
  url: ?string = null;
  proxyManager: ?ProxyManager = null;
  processManager: ?ProcessManager = null;
  url: ?string;
  client: ?Client = null;
  base: ?HTTPServer = null;
  q: Array<() => void> = [];
  options: Options;
  apiPrefix = '/__meta__/graphql';

  context = new Context();
  websocketServer = new WebSocketServer({
    noServer: true,
  });
  subscriptionServer = new SubscriptionServer(
    {
      execute,
      subscribe,
      schema,
      onConnect: () => {
        return this.context;
      },
    },
    this.websocketServer,
  );

  constructor(options: Options) {
    this.options = options;
  }

  start() {
    return createServer(this.options).then((base) => {
      this.bindToServer(base);
      return base;
    });
  }

  processAdd(base: App, entry: AddOption, ...rest: Array<*>) {
    if (Array.isArray(entry)) {
      return entry.reduce((cur, next) => {
        return this.processAdd(cur, next, ...rest);
      }, base);
    } else if (typeof entry === 'function') {
      return entry(base, ...rest);
    } else if (typeof entry === 'string') {
      const item = require(resolve(process.cwd(), entry));
      if (item.__esModule) {
        return this.processAdd(base, item.default, ...rest);
      }
      return this.processAdd(base, item, ...rest);
    } else if (typeof entry === 'undefined') {
      return base;
    }
    throw new TypeError('Invalid `add` entry.');
  }

  bindToServer(base: HTTPServer) {
    this.base = base;
    this.q.forEach((item) => {
      item(base);
    });
    this.q = [];
    this.url = `http://localhost:${base.address().port}${this.apiPrefix}`;
    debug(`Using server ${this.url}`);
    let baseApp = next;
    if (typeof this.options.url === 'string') {
      this.client = createClient(this.options.url);
    } else {
      this.client = createClient(this.url);
      baseApp = compose(
        use(
          this.apiPrefix,
          compose(
            handleCors,
            request(async (req) => {
              if (!req.headers.upgrade) {
                return replyGql({schema, context: this.context});
              }
              return next;
            }),
            upgrade(({req, socket, head}) => {
              debug('Handling GraphQL request');
              this.websocketServer.handleUpgrade(
                req,
                socket,
                head,
                (socket) => {
                  this.websocketServer.emit('connection', socket, req);
                },
              );
              return halt;
            }),
          ),
        ),
        baseApp,
      );
    }

    // Responsible for taking `PROXY_SET` actions and making them accessible
    // via the server.
    this.proxyManager = new ProxyManager(this.client);
    baseApp = compose(
      baseApp,
      this.proxyManager.app,
    );
    baseApp = compose(
      createLogger(this.client),
      baseApp,
    );

    // Create the main HTTP app. Users can add or rewrite it by using the
    // `add` option which must return a new app.
    const app = this.processAdd(baseApp, this.options.add, this.client);
    connect(
      app,
      base,
    );

    // Responsible for managing child processes.
    this.processManager = new ProcessManager(this.client);

    if (typeof this.options.config !== 'undefined') {
      const configs = Array.isArray(this.options.config)
        ? this.options.config
        : [this.options.config];
      configs.forEach((config) => this.load(config));
    }

    if (typeof this.options.content !== 'undefined') {
      const content = Array.isArray(this.options.content)
        ? this.options.content
        : [this.options.content];
      const proxies = content.map((content) => {
        const [local, path = '/'] = content.split(':');
        const url = `file://${resolve(local)}`;
        return {
          path,
          url,
        };
      });
      proxies.forEach((proxy) => this.proxy(proxy));
    }

    if (this.options.open === true) {
      open(this.url);
    }
    if (this.options.clipboard !== false) {
      clipboardy.writeSync(this.url);
    }
  }

  load(path: string) {
    debug(`Loading config: ${path}`);
    const defaultExe = process.argv[0];
    const defaultArgs = [...process.execArgv, process.argv[1]];
    const args = [
      ...defaultArgs,
      '--url',
      this.url,
      'compile',
      path,
      ...(this.options.require || []).reduce((rest, item) => {
        return ['--require', item, ...rest];
      }, []),
    ];
    this.client.mutate({
      mutation: registerProcess,
      variables: {
        path: defaultExe,
        args,
        title: `compiler (${basename(path)})`,
      },
    });
  }

  proxy(proxy: {path: string, url: string}) {
    debug(`Registering proxy: ${proxy.path} => ${proxy.url}`);
    this.client.mutate({
      mutation: registerProxy,
      variables: proxy,
    });
  }

  close(...args: Array<*>) {
    if (!this.base) {
      return;
    }
    if (this.client) {
      // this.client.close();
    }
    this.base.close(...args);
  }

  on(...args: Array<*>) {
    if (!this.base) {
      this.q.push((base) => base.on(...args));
    } else {
      this.base.on(...args);
    }
  }

  once(...args: Array<*>) {
    if (!this.base) {
      this.q.push((base) => base.once(...args));
    } else {
      this.base.once(...args);
    }
  }
}

export default Server;
