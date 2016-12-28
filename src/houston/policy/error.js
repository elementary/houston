/**
 * houston/policy/error.js
 * Holds permission errors
 *
 * @exports {PermError} default
 */

/**
 * PermError
 * A special error used for lack of permission to access a resource
 */
class PermError extends Error {

  /**
   * constructor
   * Creates a new PermError
   * NOTE: this does no real tracking on it's own. Use one of the static
   * constructors for a more clear cut way to define the error
   *
   * @param {User} u - Database user object
   *
   * @returns {PermError} - a permission error
   */
  constructor (u) {
    super('User does not have correct permissions')
    this.name = 'PermError'

    this.user = u

    // By default all of these are set to lowest rank or permission, as we don't
    // know the type of permission the user needs yet.
    this.needsRight = false // string of right the user needs to be
    this.needsAgreement = false // true if user needs to accept the TOS agreement
    this.needsAccess = false // true if user needs permission from third party like GitHub
  }

  /**
   * FromRight
   * Creates a new PermError due to permission rights
   *
   * @param {User} u - Database user object
   * @param {String} r - User right that is needed ('BETA', 'REVIEW', or 'ADMIN')
   *
   * @returns {PermError} - a permission error specifiy the need for greater permission
   */
  static FromRight (u, r) {
    const e = new PermError(u)
    e.needsRight = r.toUpperCase()
    return e
  }

  /**
   * FromAgreement
   * Creates a new PermError due to not reading TOS agreement
   *
   * @param {User} u - Database user object
   *
   * @returns {PermError} - a permission error specifiy the need for TOS agreement
   */
  static FromAgreement (u) {
    const e = new PermError(u)
    e.needsAgreement = true
    return e
  }

  /**
   * FromAccess
   * Creates a new PermError due to not having sufficent permissions on a third
   * party service like GitHub
   *
   * @param {User} u - Database user object
   *
   * @returns {PermError} - a permission error specifiy the need for third party permission
   */
  static FromAccess (u) {
    const e = new PermError(u)
    e.needsAccess = true
    return e
  }

  /**
   * code
   * Returns the error code based on what kind of PermError
   *
   * PERMERRRGT if user needs rights
   * PERMERRAGR if the user needs to agree to TOS
   * PERMERRACC if the user needs third party permission
   * PERMERR for everything else
   *
   * @return {String} - Node JS error code
   */
  get code () {
    if (this.needsRight) {
      return `PERMERRRGT`
    }

    if (this.needsAgreement) {
      return `PERMERRAGR`
    }

    if (this.needsAccess) {
      return `PERMERRACC`
    }

    return `PERMERR`
  }

  /**
   * toString
   * Returns a string used in console logs
   *
   * @returns {String} - an easy to ready APIError
   */
  toString () {
    switch (this.code) {

      case 'PERMERRRGT':
        return `PermError: ${this.user.username} needs ${this.needsRight} but has ${this.user.right}`

      case 'PERMERRAGR':
        return `PermError: ${this.user.username} needs TOS agreement`

      case 'PERMERRACC':
        return `PermError: ${this.user.username} needs third party access`

      default:
        return `PermError: ${this.user.username} is not allowed`

    }
  }
}

export default PermError
