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

test.after(async (t) => {
  await stopContainer(container)
})

test('it shoudl setup a container to test on', (t) => {
  console.log(container)
  t.pass('it works')
})
