/**
 * houston/src/lib/database/seed/projects.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the projects table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the projects table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('projects').del()

  await knex('projects').insert({
    created_at: new Date(),
    deleted_at: null,
    id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    name_developer: 'Blake Kostner',
    name_domain: 'com.github.btkostner.vocal',
    name_human: 'Vocal',
    projectable_id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    projectable_type: 'github',
    stripe_id: null,
    type: 'application',
    updated_at: new Date()
  })
}
