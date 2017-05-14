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

  await knex('projects').insert([
    {id: 1, name: 'rowValue1'},
    {id: 2, name: 'rowValue2'},
    {id: 3, name: 'rowValue3'}
  ])
}
