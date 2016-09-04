module.exports = {
  entry: {
    add: './src/houston/public/scripts/add.js'
  },
  output: {
    path: './build/houston/public/scripts',
    filename: '[name].bundle.js'
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint',
      include: 'src',
      exclude: /node_modules/
    }],
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }, {
      test: /\.pug$/,
      loader: 'pug-loader'
    }]
  }
}
