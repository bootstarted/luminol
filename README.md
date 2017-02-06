# webpack-udev-server

A better [dev-server] for [webpack].

![build status](http://img.shields.io/travis/izaakschroeder/webpack-udev-server/master.svg?style=flat)
![coverage](http://img.shields.io/coveralls/izaakschroeder/webpack-udev-server/master.svg?style=flat)
![license](http://img.shields.io/npm/l/webpack-udev-server.svg?style=flat)
![version](http://img.shields.io/npm/v/webpack-udev-server.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/webpack-udev-server.svg?style=flat)

Features:

 * Run server-side node applications in development mode.
 * Parallelized builds for multi-webpack configurations.
 * Sick emoji logging.
 * Custom HMR runtime.
 * Hot-reloading of webpack configuration files.
 * Universal, detachable IPC.
 * Simple, dynamic proxying.
 * Host multiple applications at once.

***IMPORTANT***: We're not battle-tested. Use at your own risk.

## Usage

Some minimal changes to your webpack configuration are required for using the universal dev server:


```javascript
import {runtime} from 'webpack-udev-server';
{
	entry: {
		server: [
			...runtime({ target: 'node' }),
			'./server.js',
		],
	},
}
```

All that's left is to run the dev server using whatever configuration files you want it to run:

```sh
#!/bin/sh
webpack-udev-server client.webpack.config.js server.webpack.config.js
```

Globs are totally supported too:

```sh
#!/bin/sh
webpack-udev-server config/*.webpack*.js
```

### Asset Serving

If your server is also responsible for serving webpack assets to clients you must replace that functionality with the equivalent functionality found in the dev-server – since web assets are generated in memory in development mode, your own asset serving functionality won't work since it won't be able to read that memory.

```javascript
import devAssets from 'webpack-udev-server/runtime/dev-assets';

// Pass the path to the stats file you would normally be serving assets from.
const middleware = devAssets('path/to/stats.json');
```

The resultant middleware is an instance of [http-middleware], meaning you can connect it to `express`, `hapi` or a vanilla `http` server easily.

### Hot Configuration Reloading

Start you server as normal:

```sh
#!/bin/sh
webpack-udev-server client.webpack.config.js
```

Then simply change your config file (e.g. `client.webpack.config.js`). The server will notice this and restart the compiler for you.

### Detached Builds

Start the server with no configuration files:

```sh
#!/bin/sh
PORT=7070 webpack-udev-server
```

Attach as many slaves as you want:

```sh
#!/bin/sh
PORT=7070 webpack-udev-server --slave client.webpack.config.js
```

### Multiple Applications

TODO: Write example.


[webpack]: https://webpack.github.io/
[dev-server]: https://webpack.github.io/docs/webpack-dev-server.html
[http-middleware]: https://github.com/metalabdesign/midori
