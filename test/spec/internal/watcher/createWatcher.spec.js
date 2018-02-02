import {expect} from 'chai';
import sinon from 'sinon';
import createWatcher from '/internal/watcher/createWatcher';
import createHub from '/hub/internal/createHub';
import {CONFIG_LOADED, CONFIG_EMPTY} from '/action/types';
import {pathWatched, pathUnwatched} from '/action/watcher';
import EventEmitter from 'events';

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
      once() {
        return this;
      },
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

  it('should dispatch `CONFIG_LOADED` when new items changed', () => {
    const spy = sinon.spy();
    const hub = createHub();
    let changed;
    watch.returns({
      add: () => {},
      once() {
        return this;
      },
      on(a, b) {
        if (a === 'change') {
          changed = b;
        }
        return this;
      },
    });
    hub.subscribe(CONFIG_LOADED, spy);
    createWatcher(hub);
    hub.dispatch(pathWatched('/some/path'));
    changed('foo.js');
    expect(spy).to.be.called;
  });

  it('should unwatch missing configs', () => {
    const spy = sinon.spy();
    const unwatchSpy = sinon.spy();
    const hub = createHub();
    watch.returns({
      add: () => {},
      unwatch: unwatchSpy,
      once() {
        return this;
      },
      on() {
        return this;
      },
    });
    hub.subscribe(CONFIG_LOADED, spy);
    createWatcher(hub);
    hub.dispatch(pathWatched('/some/path'));
    hub.dispatch(pathUnwatched('/some/path'));
    expect(unwatchSpy).to.be.called;
  });

  it('should detect empty configs', () => {
    const evt = new EventEmitter();
    const emptySpy = sinon.spy();
    evt.add = () => {};
    watch.returns(evt);
    const hub = createHub();
    createWatcher(hub);
    hub.dispatch(pathWatched('/some/path'));
    hub.subscribe(CONFIG_EMPTY, emptySpy);
    evt.emit('ready');
    expect(emptySpy).to.be.calledOnce;
  });

  it('should detect non-empty configs', () => {
    const evt = new EventEmitter();
    const emptySpy = sinon.spy();
    evt.add = () => {};
    watch.returns(evt);
    const hub = createHub();
    createWatcher(hub);
    hub.dispatch(pathWatched('/some/path'));
    hub.subscribe(CONFIG_EMPTY, emptySpy);
    evt.emit('add');
    evt.emit('ready');
    expect(emptySpy).not.to.be.called;
  });
});
