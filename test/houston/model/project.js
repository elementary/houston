/**
 * tests/houston/model/project.js
 * Tests project model for function abilities
 */

import chai from 'chai'

import Cycle from '~/houston/model/cycle'
import db from '~/lib/database'
import Project from '~/houston/model/project'

const assert = chai.assert

describe('project', () => {
  it('validates repo value', (done) => {
    Project.create({
      name: 'com.github.vocalapp.vocal',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      owner: new db.Types.ObjectId()
    }, (err) => {
      if (err) done(err)

      Project.create({
        name: 'net.launchpad.ubuntu.flappy',
        repo: 'lp~:ubuntu/flappy',
        tag: 'master',
        github: {
          id: 2,
          owner: 'ubuntu',
          name: 'flappy',
          token: '123456789'
        },
        owner: new db.Types.ObjectId()
      }, (err) => {
        assert.instanceOf(err, Error, 'throws an error')

        done()
      })
    })
  })

  it('has github.fullName virtual', async (done) => {
    const project = await Project.create({
      name: 'com.github.vocalapp.vocal',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      owner: new db.Types.ObjectId()
    })

    assert.equal(project.github.fullName, 'elementary/vocal', 'has github virtual')
    done()
  })

  it('has release virtual', async (done) => {
    const project = await Project.create({
      name: 'com.github.vocalapp.vocal',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      owner: new db.Types.ObjectId(),
      releases: [{
        version: '0.5.0',
        changelog: ['changed things'],
        github: {
          id: 1,
          author: 'btkostner',
          date: new Date(),
          tag: '0.5.0'
        }
      }, {
        version: '1.0.0',
        changelog: ['fixed changed things'],
        github: {
          id: 2,
          author: 'btkostner',
          date: new Date(),
          tag: '1.0.0'
        }
      }]
    })

    assert.equal(project.release.latest.version, '1.0.0', 'has accurate latest release')
    assert.equal(project.release.oldest.version, '0.5.0', 'has accurate oldest release')

    done()
  })

  it('has cycle virtual', async (done) => {
    const cycle1 = await Cycle.create({
      project: new db.Types.ObjectId(),
      auth: 'asdf',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'com.github.vocalapp.vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']]
    })

    const cycle2 = await Cycle.create({
      project: new db.Types.ObjectId(),
      auth: 'asdf',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.5',
      name: 'com.github.vocalapp.vocal',
      version: '1.0.5',
      type: 'RELEASE',
      changelog: [['fixed things']]
    })

    const project = await Project.create({
      name: 'com.github.vocalapp.vocal',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      owner: new db.Types.ObjectId(),
      cycles: [cycle1._id, cycle2._id]
    })

    const latestCycle = await project.cycle.latest
    const oldestCycle = await project.cycle.oldest

    assert.equal(latestCycle.version, '1.0.5', 'has accurate latest cycle')
    assert.equal(oldestCycle.version, '1.0.0', 'has accurate oldest cycle')

    done()
  })

  it('can get status', async (done) => {
    const project = await Project.create({
      name: 'com.github.vocalapp.vocal',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      owner: new db.Types.ObjectId()
    })

    const status = await project.getStatus()

    assert.equal(status, 'NEW', 'can get status')
    done()
  })

  it('can get status with releases', async (done) => {
    const project = await Project.create({
      name: 'com.github.vocalapp.vocal',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      _status: 'DEFER',
      owner: new db.Types.ObjectId(),
      releases: [{
        version: '0.5.0',
        changelog: ['changed things'],
        github: {
          id: 1,
          author: 'btkostner',
          date: new Date(),
          tag: '0.5.0'
        }
      }]
    })

    const status = await project.getStatus()

    assert.equal(status, 'STANDBY', 'can get status of release')
    done()
  })

  it('can set status', async (done) => {
    const project = await Project.create({
      name: 'com.github.vocalapp.vocal',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      owner: new db.Types.ObjectId()
    })

    const stat = await project.setStatus('INIT')

    assert.equal(stat.nModified, 1, 'updated status')

    done()
  })

  it('can create a cycle', async (done) => {
    const project = await Project.create({
      name: 'com.github.vocalapp.vocal',
      auth: 'asdf',
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'master',
      archs: ['amd64'],
      dists: ['xenial'],
      github: {
        id: 1,
        owner: 'elementary',
        name: 'vocal',
        token: '123456789'
      },
      owner: new db.Types.ObjectId(),
      releases: [{
        version: '0.5.0',
        changelog: ['changed things'],
        github: {
          id: 1,
          author: 'btkostner',
          date: new Date(),
          tag: '0.5.0'
        }
      }]
    })

    project.setStatus('INIT')
    .then(async () => {
      const project = await Project.findOne({})
      const cycle = await project.createCycle('RELEASE')

      assert.equal(cycle.type, 'RELEASE', 'creates release cycle')
      assert.equal(cycle.tag, project.releases[0].version, 'has correct tag')
      assert.equal(cycle.repo, project.repo, 'has correct repo')

      done()
    })
  })
})
