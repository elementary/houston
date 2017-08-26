/**
 * lib/error/permission.js
 * Holds errors related to users not having permissions
 * @flow
 *
 * TODO: The User database model does not work with flow
 *
 * @exports {PermissionError} PermissionError - A general permission error
 * @exports {PermissionAgreementError} PermissionAgreementError - User needs to accept TOS
 * @exports {PermissionRightError} PermissionRightError - User does not have correct right
 */

import { ApplicationError } from './application'

/**
 * PermissionError
 * A general permission error for a user
 *
 * @extends {ApplicationError}
 * @property {User} user - User that does not have permission
 */
export class PermissionError extends ApplicationError {
  user: Object

  /**
   * Creates a new PermissionError
   *
   * @param {User} user - User that does not have permission
   * @param {String} message - Error message
   */
  constructor (user: Object, message: string) {
    super(`${user.username} - ${message}`)

    this.user = user
  }
}

/**
 * PermissionAgreementError
 * An error due to the user not accepting the TOS agreement
 */
export class PermissionAgreementError extends PermissionError {
  /**
   * Creates a new PermissionError
   *
   * @param {User} user - User that does not have permission
   */
  constructor (user: Object) {
    super(user, 'Needs to accept TOS agreement')
  }
}

/**
 * PermissionRightError
 * An error due to the user not having the correct right
 *
 * @property {String} right - The user's needed right
 */
export class PermissionRightError extends PermissionError {
  right: string

  /**
   * Creates a new PermissionRightError
   *
   * @param {User} user - User that does not have correct right
   * @param {String} right - Needed right for the user
   */
  constructor (user: Object, right: string) {
    super(user, `Needs right ${right}`)

    this.right = right
  }
}
