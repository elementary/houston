/**
 * flightcheck/parsers/index.js
 * Index for all avalible parses
 *
 * @exports {Object} colon - Parses colon seperated lists like the Debian control file
 * @exports {Object} ini - Uses ini package for parsing files
 * @exports {Object} json - Reading and writing for json files
 */

export * as colon from './colon'
export * as ini from './ini'
export * as json from './json'
