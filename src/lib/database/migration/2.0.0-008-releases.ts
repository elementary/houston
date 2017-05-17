/**
 * houston/src/lib/database/migration/2.0.0-008-releases.ts
 * The inital houston 2.0.0 migration for releases table
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
  return knex.schema.createTable('releases', (table) => {
    table.uuid('id').primary()

    table.int('version_major').notNullable()
    table.int('version_minor').notNullable()
    table.int('version_patch').notNullable()
    table.int('version_test').nullable()

    table.boolean('is_prerelease').defaultTo(false)

    table.uuid('releaseable_id').notNullable()
    table.string('releaseable_type').notNullable()

    table.uuid('project_id').notNullable().unsigned()
    table.foreign('project_id').references('projects.id')

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('deleted_at').nullable()
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
  return knex.schema.dropTable('releases')
}
