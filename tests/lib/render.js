/**
 * tests/lib/render.js
 * Test markdown for file finding and templating ability
 */

import chai from 'chai'

import * as markdown from '~/lib/render'

const assert = chai.assert

describe('markdown', () => {
  it('uses correct variables', (done) => {
    const output = markdown.gatherVariables({
      testing: 'thing'
    })

    assert.propertyVal(output, 'testing', 'thing', 'has local variable')
    assert.deepProperty(output, 'dotNotation', 'has helpers')
    done()
  })

  it('finds correct file', (done) => {
    markdown.getTemplate('tests/mocks/markdown.md')
    .then(done())
    .catch((err) => done(err))
  })

  it('interpolates correctly', (done) => {
    const out = markdown.interpolate('${ variable } 3', { variable: 'number' })

    assert.strictEqual(out, 'number 3', 'outputs correctly')
    done()
  })

  it('templates correctly', (done) => {
    markdown.render('tests/mocks/markdown.md', {
      trueStatement: true,
      variable: 'testing'
    })
    .then((file) => {
      assert.isString(file, 'returns a string')
      assert.include(file, 'variable = testing', 'replaces variables')
      assert.include(file, 'good work', 'abides if statement')
      done()
    })
    .catch((error) => done(error))
  })
})
