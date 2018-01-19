import sinon from 'sinon';
import {expect} from 'chai';
import createDemand from '/hub/internal/createDemand';
import createHub from '/hub/internal/createHub';

describe('/hub/internal/createDemand', () => {
  it('should work when demand is provided last', () => {
    const hub = createHub();
    const demand = createDemand(hub);
    const spy = sinon.spy();
    demand.provide('foo', (action, reply) => {
      reply('derp');
    });
    demand.demand({type: 'foo', payload: 'bar'}, spy);
    expect(spy).to.be.calledWith('derp');
    expect(spy).to.be.calledOnce;
  });

  it('should work when demand is provided first', () => {
    const hub = createHub();
    const demand = createDemand(hub);
    const spy = sinon.spy();
    demand.demand({type: 'foo', payload: 'bar'}, spy);
    demand.provide('foo', (action, reply) => {
      reply('derp');
    });
    expect(spy).to.be.calledWith('derp');
    expect(spy).to.be.calledOnce;
  });
});
