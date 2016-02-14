// File of helpful functions avalible @ app.helper
import _ from 'lodash';

// Pluralizes a string if array length != 1 (1 release, 4 releases)
export function pluralize(string, array) {
  if (_.isArray(array) && array.length === 1) {
    return string;
  }

  return `${string}s`;
}

// Exports a string based on array length and string (3 releases, 1 application)
export function nString(string, array) {
  if (_.isArray(array)) {
    string = pluralize(string, array);
    return `${array.length} ${string}`;
  }

  return `${string}s`;
}
