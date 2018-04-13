// @flow
import baseDebug from 'debug';

const createDebug = (namespace: string) => {
  return baseDebug(`meta-serve:${namespace}`);
};

export default createDebug;
