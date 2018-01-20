/**
 * houston/src/lib/utility/markdown.ts
 * Parses markdown to an html string
 *
 * @example
 * ```
 *   import markdown from 'lib/utility/markdown'
 *
 *   return markdown('# this is a string')
 * ```
 */

import { defaultsDeep } from 'lodash'
import * as Markdown from 'markdown-it'

const DEFAULT_OPTS = {
  breaks: true,
  html: false,
  linkify: true,
  quotes: '“”‘’',
  typographer: true,
  xhtmlOut: true
}

/**
 * Renders a markdown string to html
 *
 * @param {String} str
 * @param {Object} [opts]
 * @return {string}
 */
export default function (str, opts = {}) {
  const markdown = new Markdown(defaultsDeep({}, DEFAULT_OPTS, opts))

  return markdown.render(str)
}
