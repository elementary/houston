/**
 * houston/src/lib/database/database.spec.ts
 * Tests configuration loading functions.
 */

import { Database } from './database'

import { setup as configSetup } from '../../../test/utility/config'

test('can migrate to latest version', async () => {
  const config = await configSetup()
  const database = new Database(config)

  return database.knex.migrate.latest()
})

test('can migrate down cleanly', async () => {
  const config = await configSetup()
  const database = new Database(config)

  await database.knex.migrate.latest()
  return database.knex.migrate.rollback()
})

test('can run database seeds', async () => {
  const config = await configSetup()
  const database = new Database(config)

  await database.knex.migrate.latest()
  return database.knex.seed.run()
})
