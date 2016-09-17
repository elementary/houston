/**
 * alias.js
 * Holds aliases to be used for webpack, babel, ava testing. Literally everything
 * NOTE: this file should be loadable without babel transcoding (node 4 support)
 *
 * @exports {Object} - all avalible path aliases
 */

const path = require('path')

module.exports = {
  resolve: {
    alias: {
      'root': path.resolve(__dirname),

      'branding': path.resolve(__dirname, 'branding'),

      'build': path.resolve(__dirname, 'build'),

      'flightcheck': path.resolve(__dirname, 'src', 'flightcheck'),
      'houston': path.resolve(__dirname, 'src', 'houston'),
      'lib': path.resolve(__dirname, 'src', 'lib'),

      'test': path.resolve(__dirname, 'test')
    }
  }
}
