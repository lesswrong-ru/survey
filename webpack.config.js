var webpack = require('webpack');

module.exports = {
  entry: './main',
  output: {
    filename: './built/bundle.js',
    path: __dirname,
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015'],
        },
      }
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
          'NODE_ENV': JSON.stringify('production')
      }
    })
  ]
};
