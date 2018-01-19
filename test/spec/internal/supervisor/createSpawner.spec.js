import {expect} from 'chai';
import sinon from 'sinon';
import createSpawner from '/internal/supervisor/createSpawner';

describe('/internal/supervisor/createSpawner', () => {
  let sandbox;
  let spawn;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    spawn = sandbox.stub(require('child_process'), 'spawn');
    spawn.returns({
      killed: true,
    });
  });

  afterEach(() => {
    sandbox.restore();
    sandbox = null;
  });

  it('should fail if no hub', () => {
    expect(() => {
      createSpawner({});
    }).to.throw(TypeError);
  });

  it('should ignore unloading invalid configs', () => {
    const manager = createSpawner({hubUrl: 'foo'});
    manager.unload('foo');
  });

  it('should load valid configs', () => {
    const manager = createSpawner({hubUrl: 'foo'});
    manager.load('foo');
  });

  it('should spawn the udev-server', () => {
    const manager = createSpawner({
      hubUrl: 'bar',
      exe: 'baz',
    });
    manager.load('foo');
    expect(spawn).to.be.calledWith('baz', [
      '--hub', 'bar',
      'compile', 'foo',
    ]);
  });
});
