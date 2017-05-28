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

test('stripe ID is not showen in json output', async () => {
  const found = await Project.query(database, (q) => {
    return q
      .where('id', '24ef2115-67e7-4ea9-8e18-ae6c44b63a71')
      .first()
  })

  expect(found).toBeInstanceOf(Project)
  expect(found).toHaveProperty('stripeId')
  expect(found.stripeId).toEqual('326599e7-97ed-455a-9c38-122651a12be6')

  const jsonOutput = found.toJson()
  const jsonInput = JSON.parse(jsonOutput)

  expect(jsonInput).toHaveProperty('id')
  expect(jsonInput).not.toHaveProperty('stripeId')
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

test('findNewestReleased returns accurate records', async () => {
  const found = await Project.findNewestReleased(database)

  expect(found).toHaveLength(3)

  // Terminal should be first
  expect(found[0]).toHaveProperty('id')
  expect(found[0].id).toEqual('4a9e027d-c27e-483a-a0fc-b2724a19491b')

  // AppCenter second
  expect(found[1]).toHaveProperty('id')
  expect(found[1].id).toEqual('75fa37dc-888d-4905-97bd-73cc9e39be2a')

  // And last should be keymaker
  expect(found[2]).toHaveProperty('id')
  expect(found[2].id).toEqual('24ef2115-67e7-4ea9-8e18-ae6c44b63a71')
})
