import {expect} from 'chai';
import createServer from '/hub/createServer';

describe('/hub/createServer', () => {
  it('should work', () => {
    expect(createServer).not.to.be.null;
  });
});
