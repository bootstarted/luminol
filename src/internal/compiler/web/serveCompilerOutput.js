/* @flow */
import {lookup} from 'mime-types';
import {
  compose,
  send,
  status,
  header,
  request,
  next,
} from 'midori';

import readFileFromCompiler from '../readFileFromCompiler';

import type {WebpackCompiler} from '/types';
import type {AppCreator} from 'midori/types';

const contentType = (f) => {
  if (/\.js$/.test(f)) {
    return 'application/javascript; charset=utf-8';
  }
  return lookup(f);
};

/**
 * Create a midori app that serves stuff from a webpack compiler.
 * @param {WebpackCompiler} compiler The compiler.
 * @returns {AppCreator} Midori app creator.
 */
const serveCompilerOutput = (compiler: WebpackCompiler): AppCreator => {
  // publicPath should end in `/` but just in case it doesn't...
  const publicPath = compiler.options.output.publicPath;
  const length = publicPath.charAt(publicPath.length - 1) !== '/' ?
    publicPath.length + 1 : publicPath.length;
  return request((req) => {
    const b = req.url.substr(length);
    return readFileFromCompiler(compiler, b).then((data) => {
      return compose(
        status(200),
        header('Content-Type', contentType(b)),
        send(data),
      );
    }, (err) => {
      if (err.code === 'EISDIR') {
        return compose(
          status(200),
          send(''),
        );
      } else if (err.code === 'ENOENT') {
        return next;
      }
      return Promise.reject(err);
    });
  });
};

export default serveCompilerOutput;
