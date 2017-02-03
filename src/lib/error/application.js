/**
 * lib/error/application.js
 * A master application error to differentiate between application errors and
 * code errors.
 * @flow
 *
 * @exports {ApplicationError} ApplicationError - A master error class
 */

/**
 * ApplicationError
 * A master error for all other errors to extend on
 *
 * @extends {Error}
 */
export class ApplicationError extends Error {}
