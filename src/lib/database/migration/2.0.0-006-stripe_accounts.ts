/**
 * houston/src/lib/database/migration/2.0.0-006-stripe_accounts.ts
 * The inital houston 2.0.0 migration for stripe accounts table
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
  return knex.schema.createTable('stripe_accounts', (table) => {
    table.string('id').primary()

    table.string('name').unique().index()
    table.string('color').nullable()
    table.string('url').nullable()

    table.string('access').notNullable()
    table.string('refresh').nullable()

    table.uuid('user_id').notNullable()
    table.foreign('user_id').references('id').inTable('users')

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
  return knex.schema.dropTable('stripe_accounts')
}
