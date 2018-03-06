// @flow
import symbol from '/internal/compiler/symbol';

import type {Hub} from './types';

const getHub = (compilation: *): ?Hub => {
  return compilation[symbol];
};

export default getHub;
