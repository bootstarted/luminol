import sinon from 'sinon';
import {expect} from 'chai';
import createWatch from '/createFileWatcher';
import createHub from '/hub/internal/createHub';
import createDemand from '/hub/internal/createDemand';
import {FILE_CONTENT_REQUEST, FILE_CONTENT_REPLY} from '/action/types';

describe('/createFileWatcher', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    clock.restore();
  });

  it('should trigger with a matching file', () => {
    const hub = createHub();
    const demand = createDemand(hub);
    const watch = createWatch('/root/file.js', {
      hub: demand,
    });
    const result = watch.poll({timeout: 300}).then((stats) => {
      expect(stats.toString('utf8')).to.equal('foo');
    });

    demand.provide(FILE_CONTENT_REQUEST, ({payload}, reply) => {
      const data = (new Buffer('foo')).toString('base64');
      reply({
        type: FILE_CONTENT_REPLY,
        payload: {file: payload.file, data},
      });
    });

    return result;
  });

  it('should timeout with no match', () => {
    const hub = createHub();
    const demand = createDemand(hub);
    const watch = createWatch('/root/file.js', {
      hub: demand,
    });
    const result = watch.poll({timeout: 300}).catch((err) => {
      expect(err).to.have.property('timeout');
    });
    clock.tick(300);
    return result;
  });
});
