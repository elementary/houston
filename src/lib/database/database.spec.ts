/**
 * houston/src/lib/database/database.spec.ts
 * Tests configuration loading functions.
 */

import { Database } from './database'

import { create } from '../../../test/utility/app'

let database: Database

beforeEach(async () => {
  const app = await create()
  database = app.get<Database>(Database)
})

test('can migrate to latest version', () => {
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
