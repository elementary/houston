/**
 * houston/src/lib/database/seed/004-github_users.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the Github users table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the Github users table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('github_users').del()

  await knex('github_users').insert({
    access_key: 'u9r0nuq083ru880589rnyq29nyvaw4etbaw34vtr',
    company: 'elementary',
    created_at: new Date(),
    email: 'blake@elementary.io',
    id: 'da527f7e-b865-46e1-a47e-99542d838298',
    key: 6423154,
    login: 'btkostner',
    name: 'Blake Kostner',
    scopes: 'public_repo,repo',
    updated_at: new Date(),
    user_id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71'
  })
}
