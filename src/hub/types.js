/* @flow */
export type Action = {|
  type: string,
  payload?: any,
  meta?: any,
  error?: boolean,
|};

export type Pattern = Array<string> | string;

export type SubscribeCallback = (a: Action) => void;
export type Unsubscribe = () => void;

export type Hub = {
  dispatch: (a: Action) => void,
  subscribe: (p: Pattern, s: SubscribeCallback) => Unsubscribe,
};

export type ProvideCallback = (a: Action, p: SubscribeCallback) => void;

export type Demand = {
  demand: (input: Action, fn: SubscribeCallback) => Unsubscribe,
  provide: (p: string, c: ProvideCallback) => Unsubscribe,
}
