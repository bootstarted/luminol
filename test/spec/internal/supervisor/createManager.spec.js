import {expect} from 'chai';
import sinon from 'sinon';
import createManager from '/internal/supervisor/createManager';
import createHub from '/hub/internal/createHub';
import {configLoaded, configUnloaded} from '/action/config';

describe('/internal/supervisor/createManager', () => {
  it('should fail if no hub', () => {
    expect(() => {
      createManager({});
    }).to.throw(TypeError);
  });

  it('should load configs for hub events', () => {
    const hub = createHub();
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    createManager(hub, {
      spawner: {load: spy1, unload: spy2},
    });
    hub.dispatch(configLoaded('foo.webpack.config'));
    expect(spy1).to.be.calledWith('foo.webpack.config');
  });

  it('should unload configs for hub events', () => {
    const hub = createHub();
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    createManager(hub, {
      spawner: {load: spy1, unload: spy2},
    });
    hub.dispatch(configLoaded('foo.webpack.config'));
    hub.dispatch(configUnloaded('foo.webpack.config'));
    expect(spy2).to.be.calledWith('foo.webpack.config');
  });
});
