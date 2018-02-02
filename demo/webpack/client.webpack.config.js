/* eslint-disable import/no-commonjs */
const path = require('path');
const StatsPlugin = require('stats-webpack-plugin');

module.exports = {
  name: 'client',
  entry: require.resolve('../client'),
  target: 'web',
  mode: 'development',
  plugins: [new StatsPlugin('stats.json')],
  output: {
    publicPath: '/js',
    path: path.resolve(path.join(__dirname, '..', 'dist', 'client')),
  },
};
