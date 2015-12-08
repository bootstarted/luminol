function resolve(entry) {
  return require.resolve(entry);
}

function hotness(target) {
  if (target === 'node') {
    return [
      'webpack/hot/signal',
    ].map(resolve);
  } else if (target === 'web') {
    return [
      'webpack/hot/only-dev-server',
    ].map(resolve);
  }
  throw new TypeError();
}

export default function runtime({ target, hot }) {
  if (target === 'node') {
    return [
      './runtime/dev-server',
      ...(hot ? hotness(target) : []),
    ].map(resolve);
  } else if (target === 'web') {
    return [
      './runtime/dev-client',
      ...(hot ? hotness(target) : []),
    ].map(resolve);
  }
  throw new TypeError();
}
