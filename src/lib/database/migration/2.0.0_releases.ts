/**
 * houston/src/lib/database/migration/2.0.0_releases.ts
 * The inital houston 2.0.0 migration for releases table
 *
 * @exports {Function} up - Database information for upgrading to version 2.0.0
 * @exports {Function} down - Database information for downgrading version 2.0.0
 */

/**
 * up
 * Database information for upgrading to version 2.0.0
 *
 * @param {Object} knex - An initalized Knex package
 * @return {Promise} - A promise of database migration
 */
export function up (knex) {
  return knex.schema.createTable('releases', (table) => {
    table.uuid('id').primary()

    table.int('version_major')
    table.int('version_minor')
    table.int('version_patch')
    table.int('version_test')

    table.boolean('is_prerelease').defaultTo(false)

    table.uuid('projectable_id')
    table.string('projectable_type')

    table.uuid('project_id')

    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').onUpdate(knex.fn.now())
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
export function down (knex) {
  return knex.schema.dropTable('releases')
}
