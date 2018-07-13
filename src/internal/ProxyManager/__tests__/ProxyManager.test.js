import ProxyManager from '/internal/ProxyManager/ProxyManager';
import createClient from '#test/util/createClient';
import {tap, send, error, compose} from 'midori';
import {fetch} from 'midori/test';

describe('ProxyManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('should timeout by default', async () => {
    const spy = jest.fn();
    const client = createClient();
    const manager = new ProxyManager(client, {
      onTimeout: tap(spy),
      timeout: 300,
    });
    const promise = fetch(manager.app);
    await Promise.resolve();
    jest.runAllTimers();
    await promise;
    expect(spy).toHaveBeenCalled();
  });
  it('should work with `file://` urls', async () => {
    const client = createClient();
    const manager = new ProxyManager(client, {
      serve: () => send('hello'),
    });
    manager.update([
      {
        path: '/',
        url: 'file:///foo/bar',
      },
    ]);
    const {body} = await fetch(manager.app, '/');
    expect(body).toBe('hello');
  });
  it('should fail on unknown protocols', async () => {
    const client = createClient();
    const manager = new ProxyManager(client);
    manager.update([
      {
        path: '/',
        url: 'banana://foo',
      },
    ]);
    const {body} = await fetch(
      compose(
        manager.app,
        error(() => send('hello')),
      ),
      '/',
    );
    expect(body).toBe('hello');
  });
  it('should call matching proxy with url', async () => {
    const client = createClient();
    const manager = new ProxyManager(client, {
      proxy: () => send('hello'),
    });
    manager.update([
      {
        path: '/foo',
        url: 'http://localhost:0/foo',
      },
    ]);
    const {body} = await fetch(manager.app, '/foo');
    expect(body).toBe('hello');
  });

  it('should prioritize longest paths', async () => {
    const taps = {
      short: send('a'),
      long: send('b'),
    };
    const client = createClient();
    const manager = new ProxyManager(client, {
      proxy: ({target: {host}}) => {
        return taps[host];
      },
    });
    manager.update([
      {
        path: '/',
        url: 'http://short:0',
      },
      {
        path: '/long',
        url: 'http://long:0/long',
      },
    ]);
    const {body} = await fetch(manager.app, '/long');
    expect(body).toBe('b');
  });

  it('should prioritize creation date after path length', async () => {
    const taps = {
      sooner: send('a'),
      later: send('b'),
    };
    const client = createClient();
    const manager = new ProxyManager(client, {
      proxy: ({target: {host}}) => {
        return taps[host];
      },
    });
    manager.update([
      {
        createdAt: 1,
        path: '/',
        url: 'http://sooner:0',
      },
      {
        createdAt: 2,
        path: '/',
        url: 'http://later:0',
      },
    ]);
    const {body} = await fetch(manager.app, '/');
    expect(body).toBe('b');
  });

  it('should hold connections open for pending URLs', async () => {
    const client = createClient();
    const manager = new ProxyManager(client, {
      proxy: () => send('hello'),
    });
    manager.update([
      {
        path: '/',
      },
    ]);
    const promise = fetch(manager.app);
    // TODO: FIXME: HACK: Fix this.
    await Promise.resolve();
    await Promise.resolve();
    manager.update([
      {
        path: '/',
        url: 'http://short:0',
      },
    ]);
    const {body} = await promise;
    expect(body).toBe('hello');
  });

  it('should work when there are no proxies', async () => {
    const client = createClient();
    const manager = new ProxyManager(client, {
      proxy: () => send('hello'),
    });
    const promise = fetch(manager.app);
    // TODO: FIXME: HACK: Fix this.
    await Promise.resolve();
    await Promise.resolve();
    manager.update([
      {
        path: '/',
        url: 'http://short:0',
      },
    ]);
    const {body} = await promise;
    expect(body).toBe('hello');
  });
});
