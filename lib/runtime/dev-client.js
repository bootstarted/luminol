/* global __resourceQuery, window, document */
/* eslint no-console: 0 */

import url from 'url';
import client from 'socket.io-client';
import stripAnsi from 'strip-ansi';

function invalidHost(hostname) {
  return !hostname || hostname === '0.0.0.0';
}

function strip(node) {
  return node.getAttribute('src').replace(/\/[^\/]+$/, '');
}

const scriptElements = document.getElementsByTagName('script');

const urlParts = url.parse(
  typeof __resourceQuery === 'string' && __resourceQuery ?
    __resourceQuery.substr(1) :
    `${strip(scriptElements[scriptElements.length - 1])}/socket.io`
);

const io = client.connect(
  url.format({
    protocol: urlParts.protocol,
    auth: urlParts.auth,
    hostname: invalidHost(urlParts.hostname) ?
      window.location.hostname : urlParts.hostname,
    port: urlParts.port,
  }), {
    path: urlParts.path === '/' ? null : urlParts.path,
  }
);

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
