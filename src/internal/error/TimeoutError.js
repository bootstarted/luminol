// @flow
import ExtendableError from 'es6-error';

export default class TimeoutError extends ExtendableError {
  timeout = true;
  constructor(msg: string = 'Timeout exceeded.') {
    super(msg);
  }
}
