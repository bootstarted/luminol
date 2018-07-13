# luminol

A better dev server.

![build status](http://img.shields.io/travis/metalabdesign/luminol/master.svg?style=flat)
![coverage](http://img.shields.io/codecov/c/github/metalabdesign/luminol/master.svg?style=flat)
![license](http://img.shields.io/npm/l/luminol.svg?style=flat)
![version](http://img.shields.io/npm/v/luminol.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/luminol.svg?style=flat)

Features:
 * Run server-side node applications in development mode.
 * Parallelized builds for multi-webpack configurations.
 * Universal, detachable IPC.
 * Simple, dynamic proxying.
 * Host multiple applications at once.

***IMPORTANT***: We're not _super_ battle-tested. Use at your own risk. The current version is a fairly major rewrite and while the external API you use for spawning the server hasn't changed much for the typical use case, a lot of stuff has changed.

## Usage

```sh
#!/bin/sh
luminol -c client.webpack.config.js -c server.webpack.config.js
```

## API

### createServer()

```javascript
import {createServer} from 'luminol';
import {compose, get, send} from 'midori';

const server = createServer({
  port: 3030,
  clipboard: true,
  hot: true,
  http2: false,
  https: false,
  logLevel: 'debug',
  open: false,
  config: [
    './webpack.config.js',
  ],
  add: (app) => {
    return compose(
      get('/status', send('OK')),
      app,
    );
  },
});

// Bind to server.
server.on('listening', () => {
  console.log(`Listening on ${server.address().port}`);
});
```

[midori]: https://github.com/metalabdesign/midori
[react-blessed]: https://github.com/Yomguithereal/react-blessed
