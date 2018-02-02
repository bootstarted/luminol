import {expect} from 'chai';
import readFileFromCompiler from '/internal/compiler/readFileFromCompiler';
import sinon from 'sinon';

describe('/internal/compiler/readFileFromCompiler', () => {
  it('should pass file name through', () => {
    const readFile = sinon.stub();
    const compiler = {outputFileSystem: {readFile}};
    readFile.callsArgWith(1, null, 'bananas');
    return readFileFromCompiler(compiler, '/foo').then(() => {
      expect(readFile).to.be.calledWith('/foo');
    });
  });
});
