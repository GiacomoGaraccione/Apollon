const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const appVersion = require('../package').version;

const outputDir = path.resolve(__dirname, '../dist');

module.exports = {
  entry: './src/main/index.tsx',
  output: {
    path: outputDir,
    filename: '[name].js',
    publicPath: "/",
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', ".css", ".scss"],
  },
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /\/node_modules\//,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              experimentalWatchApi: true,
              compilerOptions: {
                declaration: false,
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      }
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new CircularDependencyPlugin({ exclude: /node_modules/ }),
    new HtmlWebpackPlugin({
      template: './public/index.html.ejs',
      xhtml: true,
      version: appVersion,
    }),
    new CopyPlugin({
      patterns: [{ from: 'public/assets', to: outputDir }],
    }),
  ],
  devServer: {
    historyApiFallback: true,
    hot: true
  }
};
