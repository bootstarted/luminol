// flow-typed signature: 8de43da7f58ac3e01ff1913d3d8a7539
// flow-typed version: <<STUB>>/midori_v1.0.0/flow_v0.64.0

declare module 'midori' {
  import type {
    Server,
    ClientRequest,
    IncomingMessage,
    ServerResponse,
  } from 'http';
  import type {Socket} from 'net';

  declare export type ServeOptions = {
    final?: boolean,
    onDirectory?: (directory: string) => App,
    acceptRanges?: boolean,
    cacheControl?: boolean,
    dotfiles?: 'allow' | 'deny' | 'ignore',
    end?: number,
    etag?: boolean,
    extensions?: Array<string>,
    immutable?: boolean,
    index?: boolean,
    lastModified?: boolean,
    maxAge?: number | string,
    root: string,
    start?: number,
  };

  declare export type ProxyOptions = {
    target?: string | {host: string, port: number},
    forward?: string,
    agent?: *,
    ssl?: *,
    ws?: boolean,
    xfwd?: boolean,
    secure?: boolean,
    toProxy?: boolean,
    prependPath?: boolean,
    ignorePath?: boolean,
    localAddress?: string,
    changeOrigin?: boolean,
    preserveHeaderKeyCase?: boolean,
    auth?: string,
    hostRewrite?: boolean,
    autoRewrite?: boolean,
    protocolRewrite?: boolean,
    cookieDomainRewrite?: false | string | {[string]: string},
    headers?: {[string]: string},
    proxyTimeout?: number,
    onRequest?: (ClientRequest) => void,
    onResponse?: (IncomingMessage) => void,
  };

  declare type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => *,
  ) => void;

  declare export class App {}
  declare export class Matcher {}
  declare type AsyncApp = App | Promise<App>;
  declare type AppFunction<T> = ((T) => AsyncApp) => App;
  declare export type Headers = {
    [string]: string | Array<string>,
  };
  declare export type Query = {
    [string]: mixed,
  };
  declare type Disposer = () => void;

  declare export function graceful(): App;
  declare export function timing(): App;
  declare export function logging(): App;
  declare export function secure(): App;
  declare export function id(): App;
  declare export function redirect(status: number, path: string): App;
  declare export function match(matcher: Matcher, yes: App, no?: App): App;
  declare export function serve(ServeOptions): App;
  declare export function proxy(ProxyOptions): App;
  declare export function middleware(Middleware): App;
  declare export function compression(): App;
  declare export function assign(req: *, res?: *): App;
  declare export function compose(...rest: Array<App>): App;
  declare export function use(string, ...rest: Array<App>): App;
  declare export function get(string, ...rest: Array<App>): App;
  declare export function post(string, ...rest: Array<App>): App;

  declare export var request: AppFunction<IncomingMessage>;
  declare export var url: AppFunction<URL>;
  declare export var body: AppFunction<Buffer | string>;
  declare export var response: AppFunction<ServerResponse>;
  declare export var upgrade: AppFunction<{
    req: IncomingMessage,
    socket: Socket,
    head: Buffer,
  }>;
  declare export var query: AppFunction<Query>;
  declare export var pure: (*) => App;

  declare export function error(
    fn: (err: Error, req: IncomingMessage, res: ServerResponse) => AsyncApp,
  ): App;

  declare export function pending(
    fn: ((App) => void) => ?Disposer,
    options?: {
      timeout: number,
      onTimeout: App,
    },
  ): App;

  declare export function send(string | Buffer): App;
  declare export function send(number, string | Buffer): App;
  declare export function send(number, Headers, string | Buffer): App;

  declare export function status(number): App;
  declare export function header(string, string | Array<String>): App;
  declare export var next: App;
  declare export var halt: App;
  declare export function listen(App, ...rest: Array<*>): Server;
  declare export function connect(App, Server): Server;

  declare type Apply = {
    (() => AsyncApp): App,
    <V1>(AppFunction<V1>, (V1) => AsyncApp): App,
    <V1, V2>(AppFunction<V1>, AppFunction<V2>, (V1, V2) => AsyncApp): App,
    <V1, V2, V3>(
      AppFunction<V1>,
      AppFunction<V2>,
      AppFunction<V3>,
      (V1, V2, V3) => AsyncApp,
    ): App,
    <V1, V2, V3, V4>(
      AppFunction<V1>,
      AppFunction<V2>,
      AppFunction<V3>,
      AppFunction<V4>,
      (V1, V2, V3, V4) => AsyncApp,
    ): App,
    <V1, V2, V3, V4, V5>(
      AppFunction<V1>,
      AppFunction<V2>,
      AppFunction<V3>,
      AppFunction<V4>,
      AppFunction<V5>,
      (V1, V2, V3, V4, V5) => AsyncApp,
    ): App,
  };
  declare export var apply: Apply;

  declare type CreateSelector = {
    <R>(() => R): AppFunction<R>,
    <R, V1>(AppFunction<V1>, (V1) => Promise<R> | R): AppFunction<R>,
    <R, V1, V2>(
      AppFunction<V1>,
      AppFunction<V2>,
      (V1, V2) => Promise<R> | R,
    ): AppFunction<R>,
    <R, V1, V2, V3>(
      AppFunction<V1>,
      AppFunction<V2>,
      AppFunction<V3>,
      (V1, V2, V3) => Promise<R> | R,
    ): AppFunction<R>,
  };
  declare export var createSelector: CreateSelector;
}

declare module 'midori/test' {
  import type {App, Headers} from 'midori';
  declare class SyntheticResult {
    statusCode: number;
    headers: Headers;
    body: ?string;
  }
  declare export function fetch(
    App,
    string,
    opts?: {
      method: string,
      headers: Headers,
      onError: () => void,
      onNext: () => void,
    },
  ): Promise<SyntheticResult>;
}

declare module 'midori/match' {
  import type {Matcher} from 'midori';
  declare export function host(string): Matcher;
  declare export function header(string, string): Matcher;
  declare export function method(string): Matcher;
}
