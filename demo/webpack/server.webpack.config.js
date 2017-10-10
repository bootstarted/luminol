/* eslint-disable import/no-commonjs */
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  entry: require.resolve('../server'),
  target: 'node',
  externals: [nodeExternals()],
  output: {
    path: path.resolve(path.join(__dirname, '..', 'dist', 'server')),
  },
};
