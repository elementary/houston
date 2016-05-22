/**
 * tests/lib/local.js
 * Test local functions
 */

import chai from 'chai'

import * as local from '~/lib/local'

const assert = chai.assert

describe('local', () => {
  it('cmd outputs correct string on run', (done) => {
    local.cmd('echo testing')
    .then((output) => {
      assert.equal(output, 'testing', 'has correct output')
      done()
    })
    .catch((error) => done(error))
  })

  it('cmd detects errors', (done) => {
    local.cmd('thiscommandshouldnevereverexistandwehopeitdoesntdoanythingbad')
    .then(() => done(new Error('it ran a command that ended well')))
    .catch(() => done())
  })
})
