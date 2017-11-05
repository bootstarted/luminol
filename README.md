# webpack-udev-server

A better [dev-server] for [webpack].

![build status](http://img.shields.io/travis/izaakschroeder/webpack-udev-server/master.svg?style=flat)
![coverage](http://img.shields.io/coveralls/izaakschroeder/webpack-udev-server/master.svg?style=flat)
![license](http://img.shields.io/npm/l/webpack-udev-server.svg?style=flat)
![version](http://img.shields.io/npm/v/webpack-udev-server.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/webpack-udev-server.svg?style=flat)

Features:

 * Run server-side node applications in development mode.
 * Supports [react-native].
 * Parallelized builds for multi-webpack configurations.
 * Sick emoji logging.
 * Custom HMR runtime supporting `webpack^1 || webpack^2 || webpack^3`.
 * Hot-reloading of webpack configuration files.
 * Universal, detachable IPC.
 * Simple, dynamic proxying.
 * Host multiple applications at once.

***IMPORTANT***: We're not _super_ battle-tested. Use at your own risk.

## Usage

No changes to your [webpack] configuration are required for using the universal dev server. All you need to do is to run the dev server using whatever configuration files you want it to run:

```sh
#!/bin/sh
webpack-udev-server --config client.webpack.config.js server.webpack.config.js
```

Globs are totally supported too:

```sh
#!/bin/sh
webpack-udev-server --config config/*.webpack*.js
```

### Access to Stats

If your server requires access to webpack's `stats` object to get information about assets you'll need to use `watch` – since web assets are generated in memory in development mode you won't be able to read them with traditional `fs` calls. A simple example of this scenario using `express`:

```javascript
import watch from 'webpack-udev-server/watch';
import express from 'express';

const app = express();

if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  // Instead of reading stats from disk you can watch any file in your build and
  // poll that file for stats using `watch`.
  const watcher = watch('path/to/entry.js');
  app.use((req, res, next) => {
    watcher.poll().then(
      (stats) => {
        req.stats = stats;
        next();
      },
      (err) => next(err)
    );
  });
} else {
  // In production mode we can just read the data from disk instead.
  const stats = JSON.parse(fs.readFileSync('stats.json'));
  app.use((req, res, next) => {
    req.stats = stats;
    next();
  });
}
```

If your app is based on [midori] instead then you can simply use [midori-webpack] which supports this functionality out of the box.

### Configuration Reloading

In addition to reloading your app when it changes you can also reload [webpack] when your webpack configuration file changes. Start you server as normal:

```sh
#!/bin/sh
webpack-udev-server --config client.webpack.config.js
```

Then simply change your config file (e.g. `client.webpack.config.js`). The server will notice this and restart the relevant [webpack] compiler for you.

### Detached Builds

Start the server with no configuration files and it will simply wait for children:

```sh
#!/bin/sh
webpack-udev-server
```

Attach as many compilers as you want:

```sh
#!/bin/sh
webpack-udev-server \
  --slave http://localhost:8080 \
  --config client.webpack.config.js
```

### Multiple Applications

TODO: Write example.


[webpack]: https://webpack.github.io/
[dev-server]: https://webpack.github.io/docs/webpack-dev-server.html
[midori]: https://github.com/metalabdesign/midori
[midori-webpack]: https://github.com/metalabdesign/midori-webpack
[react-native]: https://github.com/facebook/react-native
