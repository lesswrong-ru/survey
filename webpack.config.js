var webpack = require('webpack');

module.exports = {
  entry: './main',
  mode: 'development',
  output: {
    path: __dirname,
    filename: './built/bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ],
  }
};
