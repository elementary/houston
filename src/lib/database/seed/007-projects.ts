/**
 * houston/src/lib/database/seed/007-projects.ts
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
    created_at: new Date(1),
    deleted_at: null,
    id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    name_developer: 'Blake Kostner',
    name_domain: 'com.github.btkostner.keymaker',
    name_human: 'Keymaker',
    projectable_id: 'b272a75e-5263-4133-b2e1-c8894b29493c',
    projectable_type: 'github',
    stripe_id: '326599e7-97ed-455a-9c38-122651a12be6',
    type: 'application',
    updated_at: new Date()
  })

  await knex('projects').insert({
    created_at: new Date(2),
    deleted_at: null,
    id: '75fa37dc-888d-4905-97bd-73cc9e39be2a',
    name_developer: 'elementary LLC',
    name_domain: 'com.github.elementary.appcenter',
    name_human: 'AppCenter',
    projectable_id: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    projectable_type: 'github',
    stripe_id: null,
    type: 'application',
    updated_at: new Date()
  })

  await knex('projects').insert({
    created_at: new Date(3),
    deleted_at: null,
    id: '0086b0d2-be43-45fc-8619-989104705c8a',
    name_developer: 'elementary LLC',
    name_domain: 'com.github.elementary.code',
    name_human: 'Code',
    projectable_id: 'b353ee74-596a-4ec8-8b1c-11589bb8eb36',
    projectable_type: 'github',
    stripe_id: null,
    type: 'application',
    updated_at: new Date()
  })

  await knex('projects').insert({
    created_at: new Date(4),
    deleted_at: null,
    id: '4a9e027d-c27e-483a-a0fc-b2724a19491b',
    name_developer: 'elementary LLC',
    name_domain: 'com.github.elementary.terminal',
    name_human: 'Terminal',
    projectable_id: '274b1d3e-85bd-4ee4-88d9-5ec18f4e87c4',
    projectable_type: 'github',
    stripe_id: null,
    type: 'application',
    updated_at: new Date()
  })
}
