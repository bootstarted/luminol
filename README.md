# webpack-udev-server

A better [dev-server] for [webpack].

![build status](http://img.shields.io/travis/metalabdesign/webpack-udev-server/master.svg?style=flat)
![coverage](http://img.shields.io/codecov/c/github/metalabdesign/webpack-udev-server/master.svg?style=flat)
![license](http://img.shields.io/npm/l/webpack-udev-server.svg?style=flat)
![version](http://img.shields.io/npm/v/webpack-udev-server.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/webpack-udev-server.svg?style=flat)

Features:
 * Run server-side node applications in development mode.
 * Supports [react-native].
 * Supports `webpack@1`, `webpack@2`, `webpack@3`, `webpack@4`.
 * Parallelized builds for multi-webpack configurations.
 * Sick emoji logging.
 * Custom HMR runtime.
 * Hot-reloading of webpack configuration files.
 * Universal, detachable IPC.
 * Simple, dynamic proxying.
 * Host multiple applications at once.

***IMPORTANT***: We're not _super_ battle-tested. Use at your own risk. The current version is a fairly major rewrite and while the external API you use for spawning the server hasn't changed much for the typical use case, a lot of stuff has changed.

## Usage

No changes to your [webpack] configuration are required for using the universal dev server. All you need to do is to run the dev server using whatever configuration files you want it to run:

```sh
#!/bin/sh
webpack-udev-server --config client.webpack.config.js --config server.webpack.config.js
```

Globs are totally supported too:

```sh
#!/bin/sh
webpack-udev-server --config config/*.webpack*.js
```

## API

### createClient()

If your server requires access to some data that's not available on the local file system you'll need to use `createClient` to connect to your `webpack-udev-server` instance – since web assets are generated in memory, (in development mode), you won't be able to read them with traditional `fs` calls. A simple example of this scenario using `express`:

```javascript
import {createClient} from 'webpack-udev-server';
import express from 'express';
import fs from 'fs';

const app = express();

if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  const devServer = createClient();
  app.use((req, res, next) => {
    devServer.getStats('client').then(
      (stats) => {
        req.stats = stats;
        next();
      },
      (err) => next(err)
    );
  });
} else {
  // In production mode we can just read the data from disk instead.
  const stats = JSON.parse(fs.readFileSync('stats.json', 'utf8'));
  app.use((req, res, next) => {
    req.stats = stats;
    next();
  });
}
```

## Architecture

There is a central IPC hub from which all other services connect:

```
==================== hub ====================
^         ^        ^      ^       ^        ^
compiler  watcher  proxy  logger  runtime  ..
```

When you start `webpack-udev-server` is generally automatically starts this hub for you and then any child processes that are spawned or any web pages that need access to the information then connect to the hub.

### proxy

The proxy is what handles routing requests to the children. It watches `PROXY_SET` events to know which paths to proxy to what URLs.

### watcher

The watcher handles generating and removing `webpack` config files to be compiled. It received `PATH_WATCHED` and `PATH_UNWATCHED` events to know what paths to monitor. In turn it generates `CONFIG_LOADED` and `CONFIG_UNLOADED` events to indicate which files should be compiled.

### supervisor

The supervisor handles spawning child processes to compile the webpack config files. It monitors `CONFIG_LOADED` and `CONFIG_UNLOADED` to determine which compilation processes to start and end.

### compiler

The compiler actually compiles the webpack config files and does any associated output management. For web this means providing a URL to access the generated assets at and informing the proxy, for node this means spawning the node child process and keeping it alive. Generally this means there will be a `PROXY_SET` event at some point so that you can access the results of your compilation through the main server.

The compiler additionally handles demand for files. So if someone needs to read the contents of a `stats.json` file then the compiler will handle this. This is done using `FILE_CONTENTS` demands.

### runtime

The dev runtime (the JS bundle that gets embedded into your application) watches for `WEBPACK_STATS` events to see if the stats file that corresponds to the JS bundle has changed. When this happens either HMR is triggered or you need to restart/reload your application. The `node` runtime additionally hijacks `http.createServer` to automatically send a `PROXY_SET` event when you create a server that starts listening.

### logger

The logger is just a dummy service that watches a variety of events and outputs them to the console. Most of the time people want to see what's going on in their app so this lets them do that. However sometimes you would prefer to have a different UI (e.g. something using [react-blessed]) and so you can turn off the console entirely if you need to.

[webpack]: https://webpack.github.io/
[dev-server]: https://webpack.github.io/docs/webpack-dev-server.html
[midori]: https://github.com/metalabdesign/midori
[midori-webpack]: https://github.com/metalabdesign/midori-webpack
[react-native]: https://github.com/facebook/react-native
[react-blessed]: https://github.com/Yomguithereal/react-blessed
