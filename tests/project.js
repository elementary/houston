/**
 * tests/project.js
 * Overarching tests for everything in this repository
 */

import aStandard from 'a-standard'
import path from 'path'

import * as lang from '~/lib/helpers/lang'
import config from '~/lib/config'

describe('project', () => {
  it('lints', (done) => {
    const maxRules = 75

    aStandard.lintFiles([], {}, (err, res) => {
      if (err) return done(err)
      if (res.errorCount === 0 && res.warningCount === 0) return done()

      let result = new Error(`${lang.s('error', res.errorCount)} and ${lang.s('warning', res.warningCount)} found`)
      result.stack = res.results.map((result) => {
        const filePath = result.filePath.replace(path.join(config.houston.root, '/'), '')

        return result.messages.map((message) => {
          return `\n${filePath}:${message.line}:${message.column} ${message.message}`
        })
      })
      .splice(0, maxRules)
      .join('')

      if (res.errorCount + res.warningCount > maxRules) {
        result.stack += `\nOnly showing first ${maxRules}`
      }

      done(result)
    })
  })
})
