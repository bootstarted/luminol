import {expect} from 'chai';
import createClientFactory from '/hub/createClient';
import createServer from '/hub/createServer';
import WebSocket from 'ws';
import http from 'http';
import EventEmitter from 'events';
import sinon from 'sinon';

describe('/hub/createClient', () => {
  describe('real websockets', () => {
    const createClient = createClientFactory(WebSocket);

    let server;
    let web;

    beforeEach((done) => {
      web = http.createServer();
      server = createServer({server: web});
      web.listen(done);
    });

    afterEach((done) => {
      web.close(done);
    });

    it('should queue messages for sending', (done) => {
      const client = createClient(server.url);
      server.subscribe('FOO', ({payload}) => {
        client.close();
        try {
          expect(payload).to.equal('bar');
        } catch (err) {
          done(err);
          return;
        }
        done();
      });
      client.dispatch({type: 'FOO', payload: 'bar'});
    });
  });

  describe('mock websockets', () => {
    let error;
    let close;
    let connectCount;
    let clock;
    let send;

    class FakeSocket {
      constructor(url) {
        this.url = url;
        this.events = new EventEmitter();
        ++connectCount;
        error = () => {
          this.events.emit('error');
        };
        close = () => {
          this.events.emit('close');
        };
        this.send = send;
      }
      addEventListener(evt, handler) {
        this.events.on(evt, handler);
      }
    }
    const createClient = createClientFactory(FakeSocket);

    beforeEach(() => {
      connectCount = 0;
      send = sinon.spy();
    });

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });
    afterEach(() => {
      clock.restore();
    });

    it('should reconnect on `error`', () => {
      createClient('foo');
      error();
      clock.tick(500);
      expect(connectCount).to.equal(2);
    });

    it('should reconnect on `close`', () => {
      createClient('foo');
      close();
      clock.tick(500);
      expect(connectCount).to.equal(2);
    });

    it('should not reconnect on `error` if closed', () => {
      const client = createClient('foo');
      client.close();
      error();
      clock.tick(500);
      expect(connectCount).to.equal(1);
    });

    it('should not reconnect on `close` if closed', () => {
      const client = createClient('foo');
      client.close();
      close();
      clock.tick(500);
      expect(connectCount).to.equal(1);
    });

    it('should send `SUBSCRIBE` when subbing', () => {
      const client = createClient('foo');
      client.subscribe('FOO', () => {});
      expect(send).to.be.calledWithMatch('"type":"SUBSCRIBE"');
    });

    it('should send `UNSUBSCRIBE` when unsubbing', () => {
      const client = createClient('foo');
      const unsub = client.subscribe('FOO', () => {});
      unsub();
      expect(send).to.be.calledWithMatch('"type":"UNSUBSCRIBE"');
    });
  });
});
