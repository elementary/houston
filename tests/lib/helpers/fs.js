/**
 * tests/lib/helpers/fs.js
 * Test fs helpers
 */

import chai from 'chai'
import path from 'path'

import config from '~/lib/config'
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

  it('walks a directory', (done) => {
    const thisDirectory = fs.walk(fs.smartPath('../'))

    assert.isArray(thisDirectory, 'returns an array')
    assert.include(thisDirectory, __filename.replace(path.join(config.houston.root, '/'), ''), 'includes this file')
    done()
  })

  it('walks a directory with filter function', (done) => {
    const thisDirectory = fs.walk(fs.smartPath('../'), (path) => {
      return path.indexOf('fs.js') !== -1
    })

    assert.isArray(thisDirectory, 'returns an array')
    assert.strictEqual(thisDirectory.length, 1, 'filters files')
    done()
  })
})
