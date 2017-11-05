import {expect} from 'chai';
import sinon from 'sinon';
import createWatcher from '/internal/watcher/createWatcher';
import createHub from '/hub/internal/createHub';
import {CONFIG_LOADED} from '/action/types';
import {pathWatched} from '/action/watcher';

describe('/internal/watcher/createWatcher', () => {
  let sandbox;
  let watch;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    watch = sandbox.stub(require('chokidar'), 'watch');
  });

  afterEach(() => {
    sandbox.restore();
    sandbox = null;
  });

  it('should dispatch `CONFIG_LOADED` when new items added', () => {
    const spy = sinon.spy();
    const addSpy = sinon.spy();
    const hub = createHub();
    let added;
    watch.returns({
      add: addSpy,
      on(a, b) {
        if (a === 'add') {
          added = b;
        }
        return this;
      },
    });
    hub.subscribe(CONFIG_LOADED, spy);
    createWatcher(hub);
    hub.dispatch(pathWatched('/some/path'));
    added('foo.js');
    expect(spy).to.be.called;
    expect(addSpy).to.be.called;
  });
});
