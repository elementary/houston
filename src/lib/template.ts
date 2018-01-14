/**
 * houston/src/lib/template.ts
 * A simple way to template strings using ejs
 *
 * @example
 * ```
 *   import template from 'lib/template'
 *
 *   return template('# <%= title %>', { title: 'testing' })
 * ```
 */

import * as ejs from 'ejs'

export default ejs.render
