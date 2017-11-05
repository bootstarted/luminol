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
});
