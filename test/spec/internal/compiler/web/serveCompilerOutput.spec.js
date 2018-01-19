import {expect} from 'chai';
import webpack from 'webpack';
import demoConfig from '/../demo/webpack/client.webpack.config.js';
import {fetch} from 'midori/test';
import MemoryFileSystem from 'memory-fs';

import serveCompilerOutput from '/internal/compiler/web/serveCompilerOutput';

const compile = (compiler) => new Promise((resolve, reject) => {
  compiler.run((err) => {
    err ? reject(err) : resolve();
  });
});

describe('/internal/compiler/serveCompilerOutput', () => {
  it('should serve files', () => {
    const compiler = webpack({
      ...demoConfig,
      name: 'foo',
      output: {
        ...demoConfig.output,
        publicPath: '/foo',
      },
    });
    compiler.outputFileSystem = new MemoryFileSystem();
    const app = serveCompilerOutput(compiler);
    return compile(compiler).then(() => {
      return fetch(app, '/foo/main.js').then((res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.contain('webpackBootstrap');
      });
    });
  });

  it('should ignore directories', () => {
    const compiler = webpack({
      ...demoConfig,
      name: 'foo',
      output: {
        ...demoConfig.output,
        publicPath: '/foo',
      },
    });
    compiler.outputFileSystem = new MemoryFileSystem();
    const app = serveCompilerOutput(compiler);
    return compile(compiler).then(() => {
      return fetch(app, '/foo').then((res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.equal('');
      });
    });
  });
});
