/**
 * houston/src/lib/database/model/base/query.spec.ts
 * Tests knex query re-writing, over-writing, and hackery
 */

import { create } from '../../../../../test/utility/app'

import { App } from '../../../app'
import { Database } from '../../database'
import { Model } from './model'
import { Query } from './query'

let app: App
let database: Database
let query: Query

beforeEach(async () => {
  app = await create()
  database = app.get<Database>(Database)

  await database.knex.migrate.latest()
  await database.knex.seed.run()

  query = new Query(database)
})

test('can do a simple database query', async () => {
  const found = await query
    .select('*')
    .from('projects')
    .where('id', '24ef2115-67e7-4ea9-8e18-ae6c44b63a71')
    .first()

  expect(found).toHaveProperty('id')
  expect(found.id).toEqual('24ef2115-67e7-4ea9-8e18-ae6c44b63a71')
})

test('can cast a database row to a Model', async () => {
  const found = await query
    .setModel(Model)
    .from('projects')
    .where('id', '24ef2115-67e7-4ea9-8e18-ae6c44b63a71')
    .first()

  expect(found).toBeInstanceOf(Model)
})
