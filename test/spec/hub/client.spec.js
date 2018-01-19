import {expect} from 'chai';
import createClientFactory from '/hub/createClient';
import createServer from '/hub/createServer';
import WebSocket from 'ws';
import http from 'http';

const createClient = createClientFactory(WebSocket);

describe('/hub/createClient', () => {
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

  it('should work with demand', (done) => {
    const client = createClient(server.url);
    server.provide('FOO', (_, reply) => {
      reply({type: 'FOO', payload: 'bar'});
    });
    client.demand({type: 'FOO'}, ({payload}) => {
      client.close();
      try {
        expect(payload).to.equal('bar');
      } catch (err) {
        done(err);
        return;
      }
      done();
    });
  });
});
