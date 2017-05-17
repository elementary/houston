/**
 * houston/src/lib/database/migration/2.0.0-005-github_repositories_github_users.ts
 * The inital houston 2.0.0 migration for pivot table between github users and
 * repositories.
 *
 * @exports {Function} up - Database information for upgrading to version 2.0.0
 * @exports {Function} down - Database information for downgrading version 2.0.0
 */

import * as Knex from 'knex'

/**
 * up
 * Database information for upgrading to version 2.0.0
 *
 * @param {Object} knex - An initalized Knex package
 * @return {Promise} - A promise of database migration
 */
export function up (knex: Knex) {
  return knex.schema.createTable('github_repositories_github_users', (table) => {
    table.increments()

    table.uuid('github_repository_id').nullable().unsigned()
    table.foreign('github_repository_id').references('github_repositories.id')

    table.uuid('github_user_id').nullable().unsigned()
    table.foreign('github_user_id').references('github_users.id')
  })
}

/**
 * down
 * Database information for downgrading version 2.0.0
 *
 * @param {Object} knex - An initalized Knex package
 * @return {Promise} - A promise of successful database migration
 */
export function down (knex: Knex) {
  return knex.schema.dropTable('github_repositories_github_users')
}
