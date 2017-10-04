/* eslint-disable import/no-commonjs */
const path = require('path');

module.exports = {
  entry: require.resolve('../client'),
  target: 'web',
  output: {
    publicPath: '/js',
    path: path.resolve(path.join(__dirname, '..', 'dist', 'client')),
  },
};
