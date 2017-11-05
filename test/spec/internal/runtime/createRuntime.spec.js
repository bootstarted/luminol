import sinon from 'sinon';
import {expect} from 'chai';
import runtime from '/internal/runtime/createRuntime';
import createHub from '/hub/internal/createHub';
import {webpackCompilerStatsGenerated} from '/action/compiler';

describe('/internal/runtime/createRuntime', () => {
  it('should reload if no HMR and hash does not match', () => {
    const hub = createHub();
    const spy = sinon.spy();
    global.__webpack_hash__ = 'bar';
    runtime({
      hub,
      name: 'foo',
      reload: spy,
    });
    const action = webpackCompilerStatsGenerated({
      hash: 'foo',
    });
    action.meta = {name: 'foo'};
    hub.dispatch(action);
    expect(spy).to.be.called;
  });

  it('should do nothing if hashes match', () => {
    const hub = createHub();
    const spy = sinon.spy();
    global.__webpack_hash__ = 'foo';
    runtime({
      hub,
      name: 'foo',
      reload: spy,
    });
    const action = webpackCompilerStatsGenerated({
      hash: 'foo',
    });
    action.meta = {name: 'foo'};
    hub.dispatch(action);
    expect(spy).not.to.be.called;
  });
});
