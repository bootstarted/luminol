// @flow
import baseDebug from 'debug';

const createDebug = (namespace: string) => {
  return baseDebug(`luminol:${namespace}`);
};

export default createDebug;
