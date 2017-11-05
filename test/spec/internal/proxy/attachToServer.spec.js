import http from 'http';
// import sinon from 'sinon';
import {expect} from 'chai';
import attachToServer from '/internal/proxy/attachToServer';
import createHub from '/hub/internal/createHub';
import {proxySet} from '/action/proxy';
import {send} from 'midori';
import fetch from 'node-fetch';

describe('/internal/proxy/attachToServer', () => {
  let server;

  beforeEach((done) => {
    server = http.createServer();
    server.listen(() => {
      const {port} = server.address();
      server.url = `http://localhost:${port}`;
      done();
    });
  });
  afterEach((done) => {
    server.close(() => {
      done();
    });
  });

  it('should work', () => {
    const hub = createHub();
    attachToServer(hub, server, {
      timeout: 30,
      proxy: () => send('hello'),
    });
    hub.dispatch(proxySet({
      url: 'http://foo/stub',
      path: '/stub',
    }));
    return fetch(`${server.url}/stub`).then((res) => {
      return res.text().then((data) => {
        expect(res.status).to.equal(200);
        expect(data).to.equal('hello');
      });
    });
  });
});
