const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  output: {
    filename: '[name].[contenthash].js',
    publicPath: "/uml-modeler/",
  },

  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: false,
      typescript: {},
    })
  ],
});
