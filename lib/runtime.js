const resolve = (entry) => require.resolve(entry);

export default ({target, force = false}) => {
  if (!force && !global.__IN_DEV_SERVER) {
    return [];
  }
  if (target === 'node') {
    return [
      './runtime/dev-server',
    ].map(resolve);
  } else if (target === 'web') {
    return [
      './runtime/dev-client',
    ].map(resolve);
  }
  throw new TypeError();
};
