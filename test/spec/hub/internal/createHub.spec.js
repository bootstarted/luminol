import {expect} from 'chai';
import sinon from 'sinon';
import createHub from '/hub/internal/createHub';

describe('/hub/internal/createHub', () => {
  it('should send actions to subscribers', () => {
    const hub = createHub();
    const spy = sinon.spy();
    const action = {type: 'FOO', payload: 'bar'};
    hub.subscribe('FOO', spy);
    hub.dispatch(action);
    expect(spy).to.be.calledWith(action);
  });

  it('should send meta subscription events', () => {
    const hub = createHub();
    const spy = sinon.spy();
    hub.subscribe('@@hub/subscribe', spy);
    hub.subscribe('FOO', spy);
    expect(spy).to.be.called;
  });

  it('should fail if you try to subscribe to odd things', () => {
    const hub = createHub();
    expect(() => {
      hub.subscribe(2345);
    }).to.throw(TypeError);
  });

  it('should respect `replyTo` meta tags', () => {
    const hub = createHub();
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    hub.subscribe('@@hub/subscribe', ({payload}) => {
      hub.dispatch({type: 'FOO', meta: {replyTo: payload.id}});
    });
    hub.subscribe('FOO', spy1);
    hub.subscribe('FOO', spy2);
    expect(spy1).to.be.calledOnce;
    expect(spy2).to.be.calledOnce;
  });

  it('should unsubscribe properly', () => {
    const hub = createHub();
    const spy = sinon.spy();
    const action = {type: 'FOO', payload: 'bar'};
    const unsub = hub.subscribe('FOO', spy);
    hub.dispatch(action);
    unsub();
    hub.dispatch(action);
    expect(spy).to.be.calledOnce;
  });
});
