/**
 * houston/src/lib/database/model/project/model.e2e.ts
 * Tests some common Project queries and stuff
 */

import { Database } from '../../database'
import { Model as Project } from './model'

import { create } from '../../../../../test/utility/app'

let database: Database

beforeEach(async () => {
  const app = await create()
  database = app.get<Database>(Database)

  await database.knex.migrate.latest()
  await database.knex.seed.run()
})

test('can fetch a Project and have it casted to a Project model', async () => {
  const results = await Project.query(database)
    .where('type', 'application')

  expect(results.length).toBe(4)

  results.forEach((result) => {
    expect(result).toBeInstanceOf(Project)
  })
})

test('whereNameDomain can search for a domain name accurately', async () => {
  const results = await Project.query(database)
    .whereNameDomain('com.github.btkostner.keymaker')

  expect(results).toBeInstanceOf(Project)
  expect(results.id).toBe('24ef2115-67e7-4ea9-8e18-ae6c44b63a71')
})

test('whereNestestReleased loads in correct order', async () => {
  const results = await Project.query(database)
    .whereNewestReleased()

  expect(results).toBeInstanceOf(Array)
  expect(results.length).toBe(3)

  expect(results[0].nameDomain).toBe('com.github.elementary.terminal')
  expect(results[1].nameDomain).toBe('com.github.elementary.appcenter')
  expect(results[2].nameDomain).toBe('com.github.btkostner.keymaker')
})

test('cast to object removes guarded attributes', async () => {
  const results = await Project.query(database)
    .whereNameDomain('com.github.btkostner.keymaker')

  const obj = results.toObject()

  expect(obj).toMatchObject({
    createdAt: new Date('1970-01-01T00:00:00.001Z'),
    deletedAt: null,
    id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    nameDeveloper: 'Blake Kostner',
    nameDomain: 'com.github.btkostner.keymaker',
    nameHuman: 'Keymaker',
    projectableId: 'b272a75e-5263-4133-b2e1-c8894b29493c',
    projectableType: 'github',
    type: 'application',
    updatedAt: obj.updatedAt
  })
})
