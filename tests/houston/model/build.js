/**
 * tests/houston/model/build.js
 * Tests build model for function abilities
 */

import chai from 'chai'

import { schema as buildSchema } from '~/houston/model/build'
import db from '~/lib/database'

const assert = chai.assert

// A simple version of cycle for seperate unit tests
const cycleSchema = new db.Schema({
  changelog: String,
  name: String,
  repo: String,
  tag: String,
  version: String,

  builds: [buildSchema]
})
const cycleModel = db.model('cycle', cycleSchema)

describe('build', () => {
  it('updates', async (done) => {
    const cycle = await cycleModel.create({
      changelog: 'changelog',
      name: 'name',
      repo: 'repo',
      tag: 'tag',
      version: 'version',
      builds: [{
        dist: 'dist',
        arch: 'arch'
      }]
    })

    cycle.builds[0].update({
      dist: 'dist1',
      arch: 'arch1'
    }, { new: true })
    .then((stat) => {
      assert.equal(stat.nModified, 1, 'updated build')
      done()
    })
  })
})
