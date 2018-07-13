import createClient from '#test/util/createClient';
import Compiler from '/internal/Compiler';
import resolve from 'resolve';

jest.mock('resolve');
jest.mock('./fake', () => {
  return 'test';
});
jest.mock('./fake-es6', () => {
  return {__esModule: true, default: 'test'};
});

describe('/internal/Compiler', () => {
  it('should parse type', () => {
    const client = createClient();
    const url = 'test';
    const compiler = new Compiler(client, url);
    const res = compiler._parseConfig('foo.config.js');
    expect(res.type).toBe('foo');
    expect(res.path).toBe('foo.config.js');
  });

  it('should parse type', () => {
    const client = createClient();
    const url = 'test';
    const compiler = new Compiler(client, url);
    const res = compiler._parseConfig('foo:bar.js');
    expect(res.type).toBe('foo');
    expect(res.path).toBe('bar.js');
  });

  it('should run config', () => {
    resolve.sync.mockReturnValue('resolve');
    const client = createClient();
    const url = 'test';
    const compiler = new Compiler(client, url);
    const spy = jest.fn();
    compiler._loadModule = jest.fn();
    compiler._loadModule.mockReturnValue(() => spy);
    compiler.runConfig('foo.config.js');
    expect(compiler._loadModule).toBeCalled();
    // expect(spy).toBeCalled();
    // TODO: FIXME: Fix test.
  });

  it('should load modules', () => {
    const client = createClient();
    const url = 'test';
    const compiler = new Compiler(client, url);
    const result = compiler._loadModule(require.resolve('./fake'));
    expect(result).toBe('test');
  });

  it('should load es6 modules', () => {
    const client = createClient();
    const url = 'test';
    const compiler = new Compiler(client, url);
    const result = compiler._loadModule(require.resolve('./fake-es6'));
    expect(result).toBe('test');
  });

  it('should throw errors if unknown type', () => {
    resolve.sync.mockReturnValue('resolve');
    const client = createClient();
    const url = 'test';
    const compiler = new Compiler(client, url);
    expect(() => {
      compiler.runConfig('foop');
    }).toThrow(Error);
  });
});
