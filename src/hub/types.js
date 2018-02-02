// @flow
export type Action = {|
  type: string,
  payload?: mixed,
  meta?: {
    [string]: mixed,
    replyTo?: string,
    name?: string,
  },
|};

export type Pattern = Array<string> | string;

export type SubscribeCallback = (a: Action) => void;
export type Unsubscribe = () => void;

export type Hub = {
  dispatch: (a: Action) => void,
  subscribe: (p: Pattern, s: SubscribeCallback) => Unsubscribe,
};

export type ProvideCallback = (a: Action, p: SubscribeCallback) => void;
