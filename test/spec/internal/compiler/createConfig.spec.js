import {expect} from 'chai';
import createConfig from '/internal/compiler/createConfig';

describe('/internal/compiler/createConfig', () => {
  it('should throw if no `entry`', () => {
    expect(() => {
      createConfig({hubUrl: 'ws://localhost'}, {});
    }).to.throw(TypeError);
  });
  it('should prepend the runtime just before the entrypoint', () => {
    const result = createConfig({hubUrl: 'ws://localhost'}, {
      entry: ['foo.js', 'bar.js'],
      name: 'foo',
    });
    // ['foo.js', ENTRY, 'bar.js']
    expect(result.entry[result.entry.length - 2]).to.contain('ws://');
  });
  it('should ensure `publicPath` has a trailing slash', () => {
    const result = createConfig({hubUrl: 'ws://localhost'}, {
      entry: 'foo.js',
      name: 'foo',
      output: {
        publicPath: '/foo',
      },
    });
    expect(result.output.publicPath).to.equal('/foo/');
  });
  it('should set `publicPath` if none exists', () => {
    const result = createConfig({hubUrl: 'ws://localhost'}, {
      entry: 'foo.js',
      name: 'foo',
    });
    expect(result.output.publicPath).to.equal('/');
  });
  it('should not add HMR plugin when `hot` is true', () => {
    const result = createConfig({hot: true, hubUrl: 'ws://localhost'}, {
      entry: 'foo.js',
      name: 'foo',
    });
    // TODO: Better check.
    expect(result.plugins.length).to.equal(2);
  });
  it('should not add HMR plugin when `hot` is false', () => {
    const result = createConfig({hot: false, hubUrl: 'ws://localhost'}, {
      entry: 'foo.js',
      name: 'foo',
    });
    // TODO: Better check.
    expect(result.plugins.length).to.equal(1);
  });
});
