/**
 * tests/lib/helpers/fs.js
 * Test fs helpers
 */

import chai from 'chai'
import path from 'path'

import * as fs from '~/lib/helpers/fs'

const assert = chai.assert

describe('fs', () => {
  it('finds a path using smartPath', (done) => {
    const path1 = fs.smartPath('../')
    const path2 = fs.smartPath('tests/')
    const path3 = fs.smartPath('/')
    const path4 = fs.smartPath('../', path.resolve(__dirname, '../../flightcheck'))

    assert.include(path1, '/tests/lib/helpers', 'correct relative paths')
    assert.include(path2, '/tests', 'correct project root relative paths')
    assert.include(path3, '/', 'doesnt mess with absolute paths')
    assert.include(path4, '/tests', 'uses relation correctly')
    done()
  })

  it('walks a directory', async (done) => {
    const tests = await fs.walk(__dirname)

    assert.isArray(tests, 'returns an array')
    assert.include(tests, path.basename(__filename), 'includes this file')
    done()
  })

  it('walks a directory with filter function', async (done) => {
    const tests = await fs.walk(fs.smartPath('../../../'), (path) => {
      return path.indexOf('fs.js') !== -1
    })

    assert.isArray(tests, 'returns an array')
    assert.strictEqual(tests.length, 1, 'filters files')
    done()
  })
})
