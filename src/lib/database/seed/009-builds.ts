/**
 * houston/src/lib/database/seed/009-builds.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the builds table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the builds table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('builds').del()

  // Keymaker builds
  await knex('builds').insert({
    appcenter: '{}',
    appstream: '{}',
    created_at: new Date(),
    id: 'dd792007-489f-4742-9f22-bf3eea9c1794',
    release_id: '6f3b3345-1b6d-457a-b6ca-5b5a067c4d6c',
    status: 'publish',
    updated_at: new Date()
  })

  // AppCenter builds
  await knex('builds').insert({
    appcenter: '{}',
    appstream: '{}',
    created_at: new Date(),
    id: 'c575d74a-1402-41ed-85a3-de4ebc5f557c',
    release_id: '3d49def5-779a-4e2b-9e8e-2ededdbd9bbe',
    status: 'fail',
    updated_at: new Date()
  })

  await knex('builds').insert({
    appcenter: '{}',
    appstream: '{}',
    created_at: new Date(),
    id: '67dc9947-0519-4471-8951-a89426c63963',
    release_id: '393c3985-f743-4daf-b868-73ce6458f4e0',
    status: 'error',
    updated_at: new Date()
  })

  await knex('builds').insert({
    appcenter: '{}',
    appstream: '{}',
    created_at: new Date(),
    id: 'd63120d9-405e-48e2-91d1-9986730c7ff0',
    release_id: '79988df7-60c8-4356-acef-745b8108dfa4',
    status: 'publish',
    updated_at: new Date()
  })

  // Terminal builds
  await knex('builds').insert({
    appcenter: '{}',
    appstream: '{}',
    created_at: new Date(),
    id: '3dc34b70-521c-46fd-990f-3f4c9ad17e4b',
    release_id: '1dc97f10-9de5-4c99-808a-0364939d6a96',
    status: 'publish',
    updated_at: new Date()
  })

  await knex('builds').insert({
    appcenter: '{}',
    appstream: '{}',
    created_at: new Date(),
    id: 'fb2ab4e9-1596-40fd-8453-92bd4cc7965c',
    release_id: '877b86e8-9b96-4bf7-8243-fe1905cdd00f',
    status: 'review',
    updated_at: new Date()
  })
}
