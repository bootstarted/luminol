// @flow
const resolve = (entry) => require.resolve(entry);

const runtimes = {
  node: resolve('./internal/runtime/node'),
  web: resolve('./internal/runtime/web'),
  webworker: resolve('./internal/runtime/web'),
};

type Options = {
  name: string,
  target: string,
  hub: string,
};

export default ({name, target, hub}: Options) => {
  if (!hub) {
    throw new TypeError('Must give valid `hub` url.');
  }
  if (!name) {
    throw new TypeError('Must give valid `name` property.');
  }
  if (target in runtimes) {
    return `${runtimes[target]}?${name}|${hub}`;
  }
  throw new TypeError(`No runtime available for '${target}'.`);
};
