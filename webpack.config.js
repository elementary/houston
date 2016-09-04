module.exports = {
  entry: {
    add: [
      'babel-polyfill',
      'whatwg-fetch',
      './src/houston/public/scripts/add.js'
    ]
  },
  output: {
    path: './build/houston/public/scripts',
    filename: '[name].bundle.js'
  },
  module: {
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
