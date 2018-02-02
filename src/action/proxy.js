// @flow
import {PROXY_SET} from './types';

// TODO: This is probably duplicated somewhere. Fix it.
type ProxyOptions = {
  url?: string,
  path: string,
};

export const proxySet = (payload: ProxyOptions) => ({
  type: PROXY_SET,
  payload,
});
