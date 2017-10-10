import compose from 'lodash/fp/compose';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import {DefinePlugin} from 'webpack';
import {loader} from 'webpack-partial';

const context = __dirname;

export default compose(
  loader({
    loader: 'babel-loader',
    exclude: /(node_modules)/,
    test: /\.js$/,
  }),
)({
  target: 'web',
  context,
  entry: './src/index.js',
  output: {
    filename: 'web.js',
    path: path.join(context, 'dist'),
    publicPath: '/__webpack_udev',
  },
  plugins: [
    new CopyWebpackPlugin([
      {from: './index.html'},
      {from: './styles.css'},
    ]),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
});
