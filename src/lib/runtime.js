const resolve = (entry) => require.resolve(entry);

const runtimes = {
  node: resolve('./runtime/node'),
  web: resolve('./runtime/web'),
  webworker: resolve('./runtime/webworker'),
};

export default ({target}) => {
  if (target in runtimes) {
    return runtimes[target];
  }
  throw new TypeError(`No runtime available for '${target}'.`);
};
