import {expect} from 'chai';
import getBaseCompilerWithHub from '/internal/compiler/getBaseCompilerWithHub';
import sinon from 'sinon';
import webpack from 'webpack';
import demoConfig from '/../demo/webpack/client.webpack.config.js';

describe('/internal/compiler/getBaseCompilerWithHub', () => {
  it('should register legacy webpack plugins', () => {
    const spy = sinon.spy();
    const compiler = {
      options: {name: 'foo'},
      plugin: (n, fn) => {
        if (n === 'run') {
          fn(compiler);
        }
      },
    };
    getBaseCompilerWithHub(null, compiler, spy);
    expect(spy).to.be.called;
  });
  it('should fail on missing hook', () => {
    const compiler = {
      hooks: {},
    };
    expect(() => {
      getBaseCompilerWithHub(null, compiler);
    }).to.throw(Error);
  });
  it('should fail with no config name', () => {
    const compiler = {
      options: {},
      plugin: (n, fn) => {
        if (n === 'run') {
          fn(compiler);
        }
      },
    };
    expect(() => {
      getBaseCompilerWithHub(null, compiler);
    }).to.throw(Error);
  });
  it('should work in multi-compilation mode', () => {
    const spy = sinon.spy();
    const compiler = webpack([{
      ...demoConfig,
      name: 'foo',
    }, {
      ...demoConfig,
      name: 'bar',
    }]);
    const ipc = {
      dispatch: () => {},
      provide: () => {},
    };
    getBaseCompilerWithHub(ipc, compiler, spy);
    const promise = new Promise((resolve, reject) => {
      compiler.run((err) => {
        err ? reject(err) : resolve();
      });
    });
    return promise.then(() => {
      expect(spy).to.be.called;
    });
  });
  it('should work in watch mode', () => {
    const spy = sinon.spy();
    const compiler = webpack({
      ...demoConfig,
      name: 'baz',
    });
    const ipc = {
      dispatch: () => {},
      provide: () => {},
    };
    getBaseCompilerWithHub(ipc, compiler, spy);
    const promise = new Promise((resolve, reject) => {
      const watcher = compiler.watch({}, (err) => {
        if (watcher) {
          watcher.close(() => {
            err ? reject(err) : resolve();
          });
        } else {
          reject(err);
        }
      });
    });
    return promise.then(() => {
      expect(spy).to.be.called;
    });
  });
});
