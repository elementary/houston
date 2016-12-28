/**
 * houston/policy/index.js
 * Easy use of all policy checks
 *
 * @exports {Function} ifMember - Checks user rights against GitHub
 * @exports {Function} ifRole - Check user permissions
 * @exports {Function} isAgreement - Checks user TOS agreement acceptence
 * @exports {Function} isRole - Koa policy for user permissions
 */

export ifMember from './ifMember'
export ifRole from './ifRole'
export isAgreement from './isAgreement'
export isRole from './isRole'
