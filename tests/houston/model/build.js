/**
 * tests/houston/model/build.js
 * Tests build scheme for function abilities
 */

import chai from 'chai'

import Cycle from '~/houston/model/cycle'

const assert = chai.assert

describe('build', () => {
  it('has cycle virtual', (done) => {
    Cycle.create({
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']],
      builds: [{
        arch: 'amd64',
        dist: 'xenial'
      }]
    }, (err, cycle) => {
      if (err) done(err)

      assert.isObject(cycle.builds[0].cycle, 'has cycle virtual')
      done()
    })
  })

  it('can update', async (done) => {
    const cycle = await Cycle.create({
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']],
      builds: [{
        arch: 'amd64',
        dist: 'xenial'
      }]
    })

    cycle.builds[0].update({
      arch: 'armhf'
    })
    .then((stat) => {
      assert.equal(stat.nModified, 1, 'updated')

      done()
    })
  })

  it('can get status', async (done) => {
    const cycle = await Cycle.create({
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']],
      builds: [{
        arch: 'amd64',
        dist: 'xenial',
        _status: 'FAIL'
      }]
    })

    const status = await cycle.builds[0].getStatus()
    assert.equal(status, 'FAIL', 'gets status')

    done()
  })

  it('can set status', async (done) => {
    const cycle = await Cycle.create({
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']],
      builds: [{
        arch: 'amd64',
        dist: 'xenial'
      }]
    })

    const stat = await cycle.builds[0].setStatus('FAIL')
    assert.equal(stat.nModified, 1, 'updated status')

    done()
  })

  it('can set file and get file', async (done) => {
    const cycle = await Cycle.create({
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']],
      builds: [{
        arch: 'amd64',
        dist: 'xenial'
      }]
    })

    const file = new Buffer('test file')

    cycle.builds[0].setFile('test', file, { meta: 'data' })
    .then(async () => {
      const cycle = await Cycle.findOne({}).exec()
      const dbFile = await cycle.builds[0].getFile('test')

      assert.isObject(dbFile, 'returns object')
      assert.deepEqual(dbFile.metadata, { meta: 'data' }, 'returns metadata')
      assert.deepEqual(dbFile.buffer, file, 'returns same buffer')

      done()
    })
  })

  it('can do build', async (done) => {
    const cycle = await Cycle.create({
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']],
      builds: [{
        arch: 'amd64',
        dist: 'xenial'
      }]
    })

    cycle.builds[0].doBuild()
    .then(() => done())
    .catch((error) => done(error))
  })
})
