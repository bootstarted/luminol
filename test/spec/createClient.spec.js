import {expect} from 'chai';
import sinon from 'sinon';
import {
  webpackCompilerStatsGenerated,
  webpackCompilerInvalid,
} from '/action/compiler';
import createClient from '/createClient';
import createHub from '/hub/internal/createHub';
import TimeoutError from '/internal/error/TimeoutError';

describe('/createClient', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    clock.restore();
  });

  it('should fetch stats', () => {
    const hub = createHub();
    const client = createClient({hub});
    hub.dispatch(webpackCompilerStatsGenerated({foo: 5}, {name: 'test'}));
    return client.getStats('test').then((x) => {
      expect(x).not.to.be.null;
    });
  });

  it('should throw timeouts', () => {
    const hub = createHub();
    const client = createClient({hub});
    const result = client.getStats('test').then(() => {
      throw new Error('fail');
    }, (x) => {
      expect(x).to.be.instanceof(TimeoutError);
    });
    clock.tick(10000);

    return result;
  });

  it('should respect invalidation events', () => {
    const hub = createHub();
    const client = createClient({hub});
    hub.dispatch(webpackCompilerStatsGenerated({foo: 5}, {name: 'test'}));
    hub.dispatch(webpackCompilerInvalid({name: 'test'}));
    const result = client.getStats('test').then(() => {
      throw new Error('fail');
    }, (x) => {
      expect(x).to.be.instanceof(TimeoutError);
    });
    clock.tick(10000);

    return result;
  });

  it('should use handle out-of-order requests', () => {
    const hub = createHub();
    const client = createClient({hub});
    const result = client.getStats('test').then((x) => {
      expect(x).not.to.be.null;
    });
    hub.dispatch(webpackCompilerStatsGenerated({foo: 5}, {name: 'test'}));
    return result;
  });

  it('should close', () => {
    const hub = createHub();
    const client = createClient({hub});
    client.close();
  });
});
