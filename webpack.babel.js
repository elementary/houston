/**
 * webpack.babel.js
 * Builds client side code for browsers
 *
 * @exports {Object} default - configuration object for webpack
 */

import path from 'path'
import webpack from 'webpack'

import cssnext from 'postcss-cssnext'

import alias from './.alias'

const browsers = [
  'last 4 version',
  'not ie <= 11'
]

export default {
  devtool: 'source-map',
  entry: {
    app: path.resolve(__dirname, 'src', 'houston', 'public', 'scripts', 'app.js')
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build', 'houston', 'public', 'scripts'),
    publicPath: '/',
    sourceMapFilename: '[name].map.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { importLoaders: 1 }
          }, {
            loader: 'postcss-loader',
            options: { plugins: [cssnext({ browsers })] }
          }]
      }
    ]
  },
  resolve: { alias: alias.resolve.alias },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      minChunks: 4
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compressor: {
        warnings: false,
        screw_ie8: true
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ]
}
