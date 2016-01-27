/* global __webpack_public_path__, window */
/* eslint no-console: 0 */

import url from 'url';
import client from 'socket.io-client';
import stripAnsi from 'strip-ansi';

function location() {
  /* eslint camelcase: 0 */
  const base = `${__webpack_public_path__}/socket.io`;
  const parts = url.parse(base);

  if (base.charAt(0) === '/') {
    return {
      ...parts,
      auth: window.location.auth,
      hostname: window.location.hostname,
      host: window.location.host,
      port: window.location.port,
      protocol: window.location.protocol,
    };
  }
  return parts;
}

const parts = location();
console.log('GOT PARTS', parts);
const io = client.connect(parts.host, {path: parts.path});

let hot = false;
let initial = true;
let currentHash = '';

io.on('hot', function() {
  hot = true;
  console.log('[WDS] Hot Module Replacement enabled.');
});

io.on('invalid', function() {
  console.log('[WDS] App updated. Recompiling...');
});

io.on('hash', function(hash) {
  currentHash = hash;
});

io.on('still-ok', function() {
  console.log('[WDS] Nothing changed.');
});

io.on('ok', function() {
  if (initial) {
    initial = false;
    return;
  }
  reloadApp();
});

io.on('warnings', function(warnings) {
  console.log('[WDS] Warnings while compiling.');
  for (let i = 0; i < warnings.length; i++) {
    console.warn(stripAnsi(warnings[i]));
  }
  if (initial) {
    initial = false;
    return;
  }
  reloadApp();
});

io.on('errors', function(errors) {
  console.log('[WDS] Errors while compiling.');
  for (let i = 0; i < errors.length; i++) {
    console.error(stripAnsi(errors[i]));
  }
  if (initial) {
    initial = false;
    return;
  }
  reloadApp();
});

io.on('proxy-error', function(errors) {
  console.log('[WDS] Proxy error.');
  for (let i = 0; i < errors.length; i++) {
    console.error(stripAnsi(errors[i]));
  }
  if (initial) {
    initial = false;
    return;
  }
  reloadApp();
});

io.on('disconnect', function() {
  console.error('[WDS] Disconnected!');
});

function reloadApp() {
  if (hot) {
    console.log('[WDS] App hot update...');
    window.postMessage(`webpackHotUpdate${currentHash}`, '*');
  } else {
    console.log('[WDS] App updated. Reloading...');
    window.location.reload();
  }
}
