import compose from 'lodash/fp/compose';
import babel from 'webpack-config-babel';
import sourceMaps from 'webpack-config-source-maps';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import {DefinePlugin} from 'webpack';

const context = __dirname;

export default compose(
  babel(),
  sourceMaps()
)({
  target: 'web',
  context,
  entry: './src/index.js',
  output: {
    filename: 'web.js',
    path: path.join(context, 'dist'),
    publicPath: '/__webpack_udev',
  },
  serve: context,
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
