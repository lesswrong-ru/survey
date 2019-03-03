var webpack = require('webpack');

module.exports = {
  entry: './js/main',
  mode: 'development',
  output: {
    path: __dirname,
    filename: './built/bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
};
