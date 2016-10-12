/**
 * lib/render.js
 * Formats files with variables
 *
 * @exports {Function} - Renders file
 */

import nunjucks from 'nunjucks'
import _ from 'lodash'

import * as helpers from './helpers'
import config from './config'

const nun = nunjucks.configure(config.houston.root, {
  autoescape: true,
  throwOnUndefined: false,
  trimBlocks: true,
  lstripBlocks: true
})

nun.addGlobal('config', config)

nun.addFilter('debianTime', helpers.debian.time)
nun.addFilter('langChop', helpers.lang.chop)

/**
 * Renders markdown
 *
 * @param {String} filePath - path to file, relative to project root
 * @param {Object} variables - all variables to included in template
 * @param {Boolean} seperate - parse for template title
 * @returns {Object} - {
 *   {String} title - template title
 *   {String} body - template bode
 * }
 */
export default function (filePath, variables, seperate = true) {
  const template = nun.render(filePath, variables)
  const output = { body: template }

  if (seperate) {
    output.title = _.trim(template.substring(0, template.indexOf('\n')), '\n')
    output.body = _.drop(template.split('\n'), 1).join('\n')
  }

  // Remove extra new lines in template
  output.body = output.body.replace(/\n{3,}/gm, '\n\n')
  output.body = _.trim(output.body, '\n')

  return output
}
