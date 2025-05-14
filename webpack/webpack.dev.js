const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    pathinfo: false,
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, '../dist'),
      publicPath: '/',
    },
    historyApiFallback: {
      index: '/index.html',
      disableDotRule: true,
      rewrites: [
        { from: /./, to: '/index.html' },
      ]
    },
    host: '0.0.0.0',
    port: 8888,
    hot: true,
  },

  plugins: [
    new ForkTsCheckerWebpackPlugin({
    }),
  ],
});
