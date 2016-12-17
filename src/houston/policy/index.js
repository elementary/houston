/**
 * houston/policy/index.js
 * Easy use of all policy checks
 *
 * @exports {PermError} PermError - constructor for permission errors
 * @exports {Function} ifMember - Checks user rights against GitHub
 * @exports {Function} ifRole - Check user permissions
 * @exports {Function} isRole - Koa policy for user permissions
 */

export PermError from './error'

export ifMember from './ifMember'
export ifRole from './ifRole'
export isRole from './isRole'
