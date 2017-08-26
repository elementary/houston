/**
 * bootstrap.js
 * Loads polyfills and other global modules.
 * NOTE: This file should only be loaded once!
 */

// Polyfill all of the new and fun javascript features for lesser versions
// TODO: remove the need for polyfill
require('babel-polyfill')

// The code forced me to overwrite native functions. I'm sorry
// TODO: move all promise logic to async native, to remove the need for bluebird
// @see https://github.com/elementary/houston/issues/189
global.Promise = require('bluebird')
