/**
 * tests/flightcheck/issues.js
 * Tests the ability to render all test issues
 */

import path from 'path'

import config from '~/lib/config'
import render from '~/lib/render'
import * as fsHelp from '~/lib/helpers/fs'

describe('issues', () => {
  it('can be rendered', async (done) => {
    const flightchecks = await fsHelp.walk('flightcheck', (wPath) => {
      return path.extname(wPath) === '.md'
    })

    flightchecks.forEach((file) => {
      try {
        render(path.join(config.houston.root, 'flightcheck', file))
      } catch (error) {
        done(error)
      }
    })

    done()
  })
})
