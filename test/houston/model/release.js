/**
 * tests/houston/model/release.js
 * Tests release model for function abilities
 */

import chai from 'chai'

import Cycle from '~/houston/model/cycle'
import db from '~/lib/database'
import Project from '~/houston/model/project'

const assert = chai.assert

/**
 * validProject
 * testing helper so we don't have to retype a project each test
 *
 * @param {Array} releases - array of release object
 * @returns {Object} project with releases
 */
const validProject = function (releases) {
  return {
    name: 'vocal',
    repo: 'git@github.com:elementary/vocal.git',
    tag: 'master',
    package: {
      name: 'vocal'
    },
    github: {
      id: 1,
      owner: 'elementary',
      name: 'vocal',
      token: '123456789'
    },
    owner: new db.Types.ObjectId(),
    releases
  }
}

describe('release', () => {
  it('has project virtual', async (done) => {
    const project = await Project.create(validProject([{
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(),
        tag: 'v0.1.0'
      }
    }]))

    assert.isObject(project.releases[0].project, 'includes project virtual')

    done()
  })

  it('has cycle virtual', async (done) => {
    const cycle1 = await Cycle.create({
      project: new db.Types.ObjectId(),
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']]
    })

    const cycle2 = await Cycle.create({
      project: new db.Types.ObjectId(),
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.5',
      name: 'vocal',
      version: '1.0.5',
      type: 'RELEASE',
      changelog: [['fixed things']]
    })

    const project = await Project.create(validProject([{
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(),
        tag: 'v0.1.0'
      },
      cycles: [cycle1._id, cycle2._id]
    }]))

    const cycle = project.releases[0].cycle
    const latestCycle = await cycle.latest
    const oldestCycle = await cycle.oldest

    assert.equal(latestCycle.version, '1.0.5', 'has accurate latest cycle')
    assert.equal(oldestCycle.version, '1.0.0', 'has accurate oldest cycle')

    done()
  })

  it('can update', async (done) => {
    const project = await Project.create(validProject([{
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(),
        tag: 'v0.1.0'
      }
    }]))

    const stat = await project.releases[0].update({
      changelog: ['oh god']
    })

    assert.equal(stat.nModified, 1, 'can update')

    done()
  })

  it('can get status with no cycles', async (done) => {
    const project = await Project.create(validProject([{
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(),
        tag: 'v0.1.0'
      }
    }]))

    const status = await project.releases[0].getStatus()
    assert.equal(status, 'STANDBY')

    done()
  })

  it('can get status with cycles', async (done) => {
    const cycle = await Cycle.create({
      project: new db.Types.ObjectId(),
      repo: 'git@github.com:elementary/vocal.git',
      tag: 'v1.0.0',
      name: 'vocal',
      version: '1.0.0',
      type: 'RELEASE',
      changelog: [['testing']],
      _status: 'PRE'
    })

    const project = await Project.create(validProject([{
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(),
        tag: 'v0.1.0'
      },
      _status: 'DEFER',
      cycles: [cycle._id]
    }]))

    const status = await project.releases[0].getStatus()
    assert.equal(status, 'PRE')

    done()
  })

  it('can set status', async (done) => {
    const project = await Project.create(validProject([{
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(),
        tag: 'v0.1.0'
      }
    }]))

    const stat = await project.releases[0].setStatus('ERROR')

    assert.equal(stat.nModified, 1, 'can update the status')

    done()
  })

  it('can create cycles', async (done) => {
    const project = await Project.create(validProject([{
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(),
        tag: 'v0.1.0'
      }
    }]))

    const release = project.releases[0]
    const cycle = await release.createCycle('INIT')

    assert.equal(cycle.type, 'INIT', 'creates init cycle')
    assert.lengthOf(cycle.builds, 1, 'creates builds based on project arch and dist')
    assert.equal(cycle.tag, release.github.tag, 'has correct tag')
    assert.equal(cycle.repo, project.repo, 'has correct repo')

    done()
  })

  it('can create changelog', async (done) => {
    const project = await Project.create(validProject([{
      version: '0.1.1',
      changelog: ['fixed changed things'],
      github: {
        id: 2,
        author: 'btkostner',
        date: new Date(2016, 4, 27),
        tag: 'v0.1.1'
      }
    }, {
      version: '0.1.0',
      changelog: ['changed things'],
      github: {
        id: 1,
        author: 'btkostner',
        date: new Date(2016, 4, 26),
        tag: 'v0.1.0'
      }
    }]))

    const changelog = await project.releases[0].createChangelog()

    const expected = [{
      author: 'btkostner',
      date: new Date(2016, 4, 27),
      version: '0.1.1',
      changelog: ['fixed changed things']
    }, {
      author: 'btkostner',
      date: new Date(2016, 4, 26),
      version: '0.1.0',
      changelog: ['changed things']
    }]

    assert.deepEqual(changelog, expected, 'has correct changelog')

    done()
  })
})
