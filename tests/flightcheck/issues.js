/**
 * tests/flightcheck/issues.js
 * Tests the ability to render all test issues
 */

import path from 'path'

import config from '~/lib/config'
import render from '~/lib/render'
import * as fsHelp from '~/lib/helpers/fs'

const flightchecks = fsHelp.walk('flightcheck', (wPath) => {
  return path.extname(path.join(config.houston.root, wPath)) === '.md'
})

describe('issues', () => {
  it('can be rendered', (done) => {
    flightchecks.forEach((file) => {
      try {
        render(file)
      } catch (error) {
        done(error)
      }
    })

    done()
  })
})
