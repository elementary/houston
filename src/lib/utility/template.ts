/**
 * houston/src/lib/utility/template.ts
 * A simple way to template strings using ejs
 *
 * @example
 * ```
 *   import template from 'lib/utility/template'
 *
 *   return template('# <%= title %>', { title: 'testing' })
 * ```
 */

import * as ejs from 'ejs'

export default ejs.render
