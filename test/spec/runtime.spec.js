import runtime from '/runtime';
import {expect} from 'chai';

describe('/runtime', () => {
  it('should work with web', () => {
    const result = runtime({hub: 'foo', target: 'web', name: 'foo'});
    expect(result).to.contain('web.js');
  });
  it('should work with node', () => {
    const result = runtime({hub: 'foo', target: 'node', name: 'foo'});
    expect(result).to.contain('node.js');
  });
  it('should work with webworker', () => {
    const result = runtime({hub: 'foo', target: 'webworker', name: 'foo'});
    expect(result).to.contain('web.js');
  });
  it('should include the hub url', () => {
    const result = runtime({hub: 'foo', target: 'web', name: 'foo'});
    expect(result).to.contain('foo');
  });
  it('should fail on invalid target', () => {
    expect(() => {
      runtime({hub: 'foo', target: 'bananas', name: 'foo'});
    }).to.throw(TypeError);
  });
  it('should fail without hub url', () => {
    expect(() => {
      runtime({target: 'web', name: 'foo'});
    }).to.throw(TypeError);
  });
  it('should fail without name', () => {
    expect(() => {
      runtime({hub: 'foo', target: 'web'});
    }).to.throw(TypeError);
  });
});
