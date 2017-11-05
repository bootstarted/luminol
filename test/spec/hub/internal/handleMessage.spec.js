import {expect} from 'chai';
import handleMessage from '/hub/internal/handleMessage';

describe('/hub/internal/handleMessage', () => {
  it('should dispatch to handlers', () => {
    const handlers = {FOO: () => {}};
    const message = JSON.stringify({type: 'FOO', payload: 'bar'});
    const result = handleMessage(handlers, message);
    expect(result).to.be.true;
  });
  it('should ignore invalid JSON', () => {
    const handlers = {FOO: () => {}};
    const message = '@@#%f';
    const result = handleMessage(handlers, message);
    expect(result).to.be.false;
  });
  it('should ignore unhandled messages', () => {
    const handlers = {};
    const message = JSON.stringify({type: 'FOO', payload: 'bar'});
    const result = handleMessage(handlers, message);
    expect(result).to.be.false;
  });
});
