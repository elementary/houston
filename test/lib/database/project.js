/**
 * test/lib/database/project.js
 * Tests Project model functions and schema
 */

import test from 'ava'
import mock from 'mock-require'
import path from 'path'

import { startContainer, stopContainer } from 'test/helpers/database'
import alias from 'root/.alias'
import mockConfig from 'test/fixtures/config'

let config = null
let container = null
let db = null
let Project = null

test.before(async (t) => {
  mock(path.resolve(alias.resolve.alias['root'], 'config.js'), mockConfig)

  config = require(path.resolve(alias.resolve.alias['lib'], 'config')).default
  container = await startContainer(config.flightcheck.docker)
  db = require(path.resolve(alias.resolve.alias['lib'], 'database', 'connection')).default
  Project = require(path.resolve(alias.resolve.alias['lib'], 'database', 'project')).default

  db.connect(container.mongo)
})

test.after.always(async (t) => {
  await stopContainer(container)
})

test('toJSON moves _id field to id', (t) => {
  const one = new Project({
    _id: db.mongo.ObjectId()
  })
  const two = one.toJSON()

  t.is(two['_id'], undefined)
  t.true(two['id'].equals(one['_id']))
})

test('toJSON moves removes error object', (t) => {
  const one = new Project({
    error: { test: 'something' }
  })
  const two = one.toJSON()

  t.is(two['error'], undefined)
})

test('toJSON moves removes Stripe access key', (t) => {
  const one = new Project({
    stripe: { access: 'testing' }
  })
  const two = one.toJSON()

  t.is(two['stripe']['access'], undefined)
})

test('toJSON moves removes Stripe refresh key', (t) => {
  const one = new Project({
    stripe: { refresh: 'testing' }
  })
  const two = one.toJSON()

  t.is(two['stripe']['refresh'], undefined)
})

test('name.human virtual returns custom name first', (t) => {
  const one = new Project({
    name: {
      custom: 'super awesome app',
      desktop: 'Super Awesome',
      domain: 'com.github.super.awesome'
    }
  })

  t.is(one['name']['human'], one['name']['custom'])
})

test('name.human virtual returns desktop name second', (t) => {
  const one = new Project({
    name: {
      desktop: 'Super Awesome',
      domain: 'com.github.super.awesome'
    }
  })

  t.is(one['name']['human'], one['name']['desktop'])
})

test('name.human virtual returns domain name last', (t) => {
  const one = new Project({
    name: {
      domain: 'com.github.super.awesome'
    }
  })

  t.is(one['name']['human'], one['name']['domain'])
})

test('name.human virtual sets the custom name', (t) => {
  const one = new Project()
  one.name.human = 'super awesome app'

  t.is(one['name']['custom'], 'super awesome app')
})

test('github.name virtual returns user/repo format', (t) => {
  const one = new Project({
    github: {
      owner: 'elementary',
      repo: 'houston'
    }
  })

  t.is(one['github']['name'], 'elementary/houston')
})

test('getSelfStatus returns ERROR if error exists', async (t) => {
  const one = new Project({
    error: { test: 'thing' }
  })

  t.is(await one.getSelfStatus(), 'ERROR')
})

test('getSelfStatus returns new if no releases exist', async (t) => {
  const one = new Project()

  t.is(await one.getSelfStatus(), 'NEW')
})

test('getSelfStatus returns DEFER if releases exist', async (t) => {
  const one = new Project({
    releases: [{}]
  })

  t.is(await one.getSelfStatus(), 'DEFER')
})

test('findRelease returns the latest existing release', async (t) => {
  const one = db.mongo.ObjectId()
  const two = new Project({
    releases: [{}, {}, {}, {
      '_id': one
    }]
  })
  const three = await two.findRelease()

  t.true(three['_id'].equals(one))
})
