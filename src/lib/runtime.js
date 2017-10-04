const resolve = (entry) => require.resolve(entry);

export default ({target}) => {
  if (target === 'node') {
    return [
      './runtime/dev-server',
    ].map(resolve);
  } else if (target === 'web') {
    return [
      './runtime/dev-client',
    ].map(resolve);
  }
  throw new TypeError(`No runtime available for '${target}'.`);
};
