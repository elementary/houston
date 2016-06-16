/**
 * tests/project.js
 * Overarching tests for everything in this repository
 */

import aStandard from 'a-standard'
import path from 'path'

import * as lang from '~/lib/helpers/lang'
import config from '~/lib/config'

describe('project', () => {
  it('lints', function (done) {
    this.timeout(0) // Why is this a thing? I don't even. Thanks Obama
    const maxRules = 75

    aStandard.lintFiles([], {}, (err, res) => {
      if (err) return done(err)
      if (res.errorCount === 0 && res.warningCount === 0) return done()

      const result = new Error(`${lang.s('error', res.errorCount)} and ${lang.s('warning', res.warningCount)} found`)
      result.stack = res.results.map((result) => {
        if (result.messages.length <= 0) {
          return ''
        }

        let rtn = `\n    ${result.filePath.replace(path.join(config.houston.root, '/'), '')}`

        rtn += result.messages.map((message) => {
          let rtn = '\n      '
          rtn += `${message.line}:${message.column}${' '.repeat(7 - (message.line.toString().length + message.column.toString().length))}`
          rtn += `${message.message} (${message.ruleId})`
          return rtn
        })

        return rtn
      })
      .splice(0, maxRules)
      .join('')

      if (res.errorCount + res.warningCount > maxRules) {
        result.stack += `\nOnly showing first ${maxRules}`
      }

      return done(result)
    })
  })
})
