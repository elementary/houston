/**
 * tests/flightcheck/issues.js
 * Tests the ability to render all test issues
 */

import path from 'path'

import config from '~/lib/config'
import render from '~/lib/render'
import * as fsHelp from '~/lib/helpers/fs'

describe('issues', () => {
  it('can be rendered', (done) => {
    const files = fsHelp.walk('flightcheck', (wPath) => {
      return path.extname(path.join(config.houston.root, wPath)) === '.md'
    })

    files.forEach((file) => {
      try {
        render(file)
      } catch (error) {
        done(error)
      }
    })

    done()
  })
})
