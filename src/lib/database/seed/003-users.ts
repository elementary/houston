/**
 * houston/src/lib/database/seed/003-users.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the users table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the users table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('users').del()

  await knex('users').insert({
    created_at: new Date(),
    deleted_at: null,
    email: 'blake@elementary.io',
    id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    name: 'Blake Kostner',
    updated_at: new Date()
  })
}
