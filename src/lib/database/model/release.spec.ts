/**
 * houston/src/lib/database/model/release.spec.ts
 * Tests the release class for everything possible
 */

import { Release } from './release'

import { setup as setupConfig } from '../../../../test/utility/config'
import { setup as setupDatabase } from '../../../../test/utility/database'

let config = null
let database = null

beforeEach(async () => {
  config = await setupConfig()
  database = await setupDatabase(config)
})

test('findByNameDomainAndVersion finds correctly', async () => {
  const found = await Release.findByNameDomainAndVersion(database, 'com.github.btkostner.keymaker', '0.0.3')

  expect(found).toBeInstanceOf(Release)
  expect(found).toHaveProperty('id')
  expect(found.id).toEqual('6f3b3345-1b6d-457a-b6ca-5b5a067c4d6c')
})

test('findByNameDomainAndVersion returns null when not found', async () => {
  const found = await Release.findByNameDomainAndVersion(database, 'com.github.btkostner.keymaker', '9.9.9')

  expect(found).toEqual(null)
})

test('findNewestReleased returns an accurate list', async () => {
  const found = await Release.findNewestReleased(database)

  expect(found).toHaveLength(3)

  // AppCenter should be first
  expect(found[0]).toHaveProperty('id')
  expect(found[0].id).toEqual('79988df7-60c8-4356-acef-745b8108dfa4')

  // Keymaker second
  expect(found[1]).toHaveProperty('id')
  expect(found[1].id).toEqual('6f3b3345-1b6d-457a-b6ca-5b5a067c4d6c')

  // And last should be terminal
  expect(found[2]).toHaveProperty('id')
  expect(found[2].id).toEqual('1dc97f10-9de5-4c99-808a-0364939d6a96')
})
