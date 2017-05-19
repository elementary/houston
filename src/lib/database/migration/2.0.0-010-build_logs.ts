/**
 * houston/src/lib/database/migration/2.0.0-010-build_logs.ts
 * The inital houston 2.0.0 migration for build logs table
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
  return knex.schema.createTable('build_logs', (table) => {
    table.uuid('id').primary()

    table.string('title').notNullable()
    table.string('body').notNullable()

    table.string('test').nullable()

    table.jsonb('metadata').nullable()

    table.uuid('build_id').nullable().unsigned()
    table.foreign('build_id').references('builds.id')

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
  return knex.schema.dropTable('build_logs')
}
