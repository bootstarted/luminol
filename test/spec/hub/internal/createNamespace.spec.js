import sinon from 'sinon';
import {expect} from 'chai';
import createNamespace from '/hub/internal/createNamespace';
import createHub from '/hub/internal/createHub';

describe('/hub/internal/createNamespace', () => {
  it('should not send messages to the incorrect namespace', () => {
    const hub = createHub();
    const ns1 = createNamespace(hub, 'namespace1');
    const ns2 = createNamespace(hub, 'namespace2');
    const spy = sinon.spy();
    ns1.subscribe('foo', spy);
    ns2.dispatch({type: 'foo'});
    expect(spy).to.not.be.called;
  });

  it('should send messages to the correct namespace', () => {
    const hub = createHub();
    const ns1 = createNamespace(hub, 'namespace1');
    const ns2 = createNamespace(hub, 'namespace2');
    const spy = sinon.spy();
    ns1.subscribe('foo', spy);
    ns2.dispatch({type: 'foo'});
    ns1.dispatch({type: 'foo'});
    expect(spy).to.be.calledOnce;
    expect(spy).to.be.calledWithMatch({type: 'foo'});
  });
});
