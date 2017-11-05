import sinon from 'sinon';
import {expect} from 'chai';
import createProxy from '/internal/proxy/createProxy';
import {tap, send} from 'midori';
import {fetch} from 'midori/test';

describe('createProxy', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    clock.restore();
  });

  it('should timeout by default', () => {
    const spy = sinon.spy();
    const proxies = createProxy({
      onTimeout: tap(spy),
      timeout: 300,
    });
    const app = proxies();

    const promise = fetch(app);
    clock.tick(300);
    return promise.then(() => {
      expect(spy).to.be.called;
    });
  });

  it('should call matching proxy with url', () => {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const proxies = createProxy({
      onTimeout: tap(spy1),
      timeout: 300,
      proxy: () => {
        return tap(spy2);
      },
    });
    const app = proxies();
    proxies.update([{
      path: '/foo',
      url: 'http://localhost:0/foo',
    }]);
    return fetch(app, '/foo').then(() => {
      expect(spy1).not.to.be.called;
      expect(spy2).to.be.called;
    });
  });

  it('should prioritize longest paths', () => {
    const spy1 = sinon.spy();
    const taps = {
      short: send('a'),
      long: send('b'),
    };
    const proxies = createProxy({
      onTimeout: tap(spy1),
      timeout: 300,
      proxy: ({target: {host}}) => {
        return taps[host];
      },
    });
    const app = proxies();
    proxies.update([{
      path: '/',
      url: 'http://short:0',
    }, {
      path: '/long',
      url: 'http://long:0/long',
    }]);
    return fetch(app, '/long').then(({body}) => {
      expect(spy1).not.to.be.called;
      expect(body).to.equal('b');
    });
  });
});
