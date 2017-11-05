import {expect} from 'chai';
import normalizeConfig from '/internal/compiler/normalizeConfig';
import {identity} from 'ramda';

describe('/internal/compiler/normalizeConfig', () => {
  it('should fail for empty arrays', () => {
    expect(() => {
      normalizeConfig([], identity);
    }).to.throw(TypeError);
  });
  it('should fail for null values', () => {
    expect(() => {
      normalizeConfig(null, identity);
    }).to.throw(TypeError);
  });
  it('should return single value for single item arrays', () => {
    const config = {};
    const result = normalizeConfig([config], identity);
    expect(result).to.equal(config);
  });

  it('should return all values for other arrays', () => {
    const config = [{}, {}];
    const result = normalizeConfig(config, identity);
    expect(result).to.deep.equal(config);
  });

  it('should original value for non-arrays', () => {
    const result = normalizeConfig({foo: 5}, identity);
    expect(result).to.deep.equal({foo: 5});
  });
});
