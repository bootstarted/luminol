// @flow
import hook from './hook';
// import symbol from './symbol';
import type {Hub, WebpackCompiler} from '/types';
import type {
  Action,
} from '/hub/types';

type Callback = (hub: Hub, compiler: WebpackCompiler) => void;

const wrap = (baseHub: Hub, compiler: WebpackCompiler, fn: Callback) => {
  return (compiler: WebpackCompiler) => {
    const name = compiler.options && compiler.options.name;
    if (typeof name !== 'string' || name.length <= 0) {
      throw new TypeError('Must provide named webpack configuration.');
    }
    const hub: Hub = {
      ...baseHub,
      // TODO: Also override subscribe so that when the compiler watch ends
      // we also unsubscribe from everything.
      dispatch: (action: Action) => {
        const newAction = {
          ...action,
          meta: {
            ...action.meta,
            name,
            pid: process.pid,
          },
        };
        return baseHub.dispatch(newAction);
      },
    };
    // compiler[symbol] = hub;
    // hook(compiler, 'this-compilation', (compilation) => {
    //   compilation[symbol] = hub;
    // });
    fn(hub, compiler);
  };
};

const getBaseCompilerWithHub = (
  hub: Hub,
  compiler: WebpackCompiler,
  fn: Callback
) => {
  const wrapper = wrap(hub, compiler, fn);
  // TODO: FIXME: Determine check for `isMultiCompiler`. This is just some
  // fake stub that always returns false right now. The only reason this block
  // is even in here is because of the following GitHub issue:
  // https://github.com/webpack/watchpack/issues/25. Really the first block of
  // code should probably always be executed.
  if (Array.isArray(compiler.compilers)) {
    hook(compiler, 'run', wrapper);
    hook(compiler, 'watch-run', wrapper);
  } else {
    wrapper(compiler);
  }
};

export default getBaseCompilerWithHub;
