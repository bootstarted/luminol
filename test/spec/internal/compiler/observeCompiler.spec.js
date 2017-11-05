import {expect} from 'chai';
import observeCompiler from '/internal/compiler/observeCompiler';
import {WEBPACK_STATS, WEBPACK_COMPILER_COMPILING} from '/action/types';
import sinon from 'sinon';
import webpack from 'webpack';
import demoConfig from '/../demo/webpack/client.webpack.config.js';

describe('/internal/compiler/observeCompiler', () => {
  it('should work with a real compiler', () => {
    const spy = sinon.spy();
    const compiler = webpack({
      ...demoConfig,
      name: 'foo',
    });
    const ipc = {
      dispatch: spy,
      provide: () => {},
    };
    observeCompiler(ipc, compiler);
    const promise = new Promise((resolve, reject) => {
      compiler.run((err) => {
        err ? reject(err) : resolve();
      });
    });
    return promise.then(() => {
      expect(spy).to.be.calledWithMatch({
        type: WEBPACK_STATS,
      });
      expect(spy).to.be.calledWithMatch({
        type: WEBPACK_COMPILER_COMPILING,
      });
    });
  });
});
