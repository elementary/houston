/**
 * houston/src/lib/database/model/project.spec.ts
 * Tests the project class for everything possible
 */

import { Project } from './project'

import { setup as setupConfig } from '../../../../test/utility/config'
import { setup as setupDatabase } from '../../../../test/utility/database'

let config = null
let database = null

beforeEach(async () => {
  config = await setupConfig()
  database = await setupDatabase(config)
})

test('findById returns a single Project model', async () => {
  const found = await Project.findById(database, '24ef2115-67e7-4ea9-8e18-ae6c44b63a71')

  expect(found).toBeInstanceOf(Project)
  expect(found).toHaveProperty('nameDomain')
  expect(found.nameDomain).toEqual('com.github.btkostner.keymaker')
})

test('findById returns null if no project found', async () => {
  const found = await Project.findById(database, '11111111-2222-3333-4444-555555555555')

  expect(found).toEqual(null)
})

test('findByNameDomain can find a project by the name domain', async () => {
  const found = await Project.findByNameDomain(database, 'com.github.elementary.terminal')

  expect(found).toBeInstanceOf(Project)
  expect(found).toHaveProperty('nameHuman')
  expect(found.nameHuman).toEqual('Terminal')
})


test('findByNameDomain returns null if not found', async () => {
  const found = await Project.findByNameDomain(database, 'com.exists.should.never')

  expect(found).toEqual(null)
})
