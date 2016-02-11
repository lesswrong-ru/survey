module.exports = {
  entry: './main',
  output: {
    filename: './bundle.js',
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
};
