/**
 * tests/lib/render.js
 * Test markdown for file finding and templating ability
 */

import chai from 'chai'

import render from '~/lib/render'

const assert = chai.assert

describe('markdown', () => {
  it('templates correctly', (done) => {
    const file = render('tests/mocks/markdown.md', {
      trueStatement: true,
      variable: 'testing'
    })

    assert.strictEqual(file.title, '# this is a markdown file', 'has correct title')
    assert.strictEqual(file.body, '### used for testing markdown functions\n\nvariable = testing\n\ngood stuff', 'has correct body')
    done()
  })
})
