/* @flow */
import type {WebpackCompiler} from '/types';

const camelize = (str: string): string =>
  str.replace(/-(.)/g, (_, x) => x.toUpperCase());

/**
 * This is just a utility function to handle both webpack@4 and older hooks.
 * @param {WebpackCompiler} compiler The compiler.
 * @param {String} event The event to hook.
 * @param {Function} callback What to do on the event.
 * @returns {void}
 */
const hook = (
  compiler: WebpackCompiler,
  event: string,
  callback: Function,
): void => {
  // TODO: Consider returning an unhook function à la hub.
  if (compiler.hooks) {
    const hook = compiler.hooks[camelize(event)];
    if (!hook || typeof hook.tap !== 'function') {
      throw new TypeError(`Invalid hook: '${event}'.`);
    }
    hook.tap('udev-hook', callback);
    return;
  } else if (typeof compiler.plugin === 'function') {
    compiler.plugin(event, callback);
    return;
  }
  throw new TypeError();
};

export default hook;
