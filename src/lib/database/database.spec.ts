/**
 * houston/src/lib/database/database.spec.ts
 * Tests configuration loading functions.
 */

import { Database } from './database'

import { setup as setupConfig } from '../../../test/utility/config'

let config = null
let database = null

beforeEach(async () => {
  config = await setupConfig()
  database = new Database(config)
})

test('can migrate to latest version', async () => {
  return database.knex.migrate.latest()
})

test('can migrate down cleanly', async () => {
  await database.knex.migrate.latest()
  return database.knex.migrate.rollback()
})

test('can run database seeds', async () => {
  await database.knex.migrate.latest()
  return database.knex.seed.run()
})
