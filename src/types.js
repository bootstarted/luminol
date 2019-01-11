// @flow
import type ApolloClient from 'apollo-client';

export type WebProxy = {
  path: string,
  url: string,
};

export type Config = {
  id: string,
  path: string,
};

export interface Spawner<T> {
  unload: (T) => void;
  load: (config: Config) => T;
}

// TODO: Determine cache shape
export type Client = ApolloClient<*>;
