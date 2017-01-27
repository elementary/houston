/**
 * flightcheck/file/parsers/index.js
 * Index for all avalible parses
 *
 * @exports {Object} colon - Parses colon seperated lists like the Debian control file
 * @exports {Object} ini - Uses ini package for parsing files
 * @exports {Object} json - Reading and writing for json files
 * @exports {Object}  xml - Uses xml package for parsing and writing xml files
 */

export * as colon from './colon'
export * as ini from './ini'
export * as json from './json'
export * as xml from './xml'
