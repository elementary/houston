/**
 * houston/src/lib/database/seed/001-github_repositories.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the Github repositories table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the Github repositories table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('github_repositories').del()

  await knex('github_repositories').insert({
    created_at: new Date(),
    deleted_at: null,
    id: 'b272a75e-5263-4133-b2e1-c8894b29493c',
    is_private: false,
    key: 891357,
    name: 'keymaker',
    owner: 'btkostner',
    updated_at: new Date()
  })

  await knex('github_repositories').insert({
    created_at: new Date(),
    deleted_at: null,
    id: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    is_private: false,
    key: 8234623,
    name: 'appcenter',
    owner: 'elementary',
    updated_at: new Date()
  })

  await knex('github_repositories').insert({
    created_at: new Date(),
    deleted_at: null,
    id: 'b353ee74-596a-4ec8-8b1c-11589bb8eb36',
    is_private: false,
    key: 48913751,
    name: 'code',
    owner: 'elementary',
    updated_at: new Date()
  })

  await knex('github_repositories').insert({
    created_at: new Date(),
    deleted_at: null,
    id: '274b1d3e-85bd-4ee4-88d9-5ec18f4e87c4',
    is_private: false,
    key: 49876157,
    name: 'terminal',
    owner: 'elementary',
    updated_at: new Date()
  })
}
