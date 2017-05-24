/**
 * houston/src/lib/database/seed/002-github_releases.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the Github releases table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the Github releases table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('github_releases').del()

  // Keymaker releases
  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: 'b272a75e-5263-4133-b2e1-c8894b29493c',
    id: 'fed7651d-be81-4035-98bd-efa08e95a948',
    key: 946542,
    tag: '0.0.1',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: 'b272a75e-5263-4133-b2e1-c8894b29493c',
    id: 'b1a4e61c-d10b-4bcd-b18a-f7469bfd4df1',
    key: 102154,
    tag: '0.0.2',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: 'b272a75e-5263-4133-b2e1-c8894b29493c',
    id: '01645e34-1f00-4416-9734-030ea5dd9b48',
    key: 121548,
    tag: '0.0.3',
    updated_at: new Date()
  })

  // AppCenter releases
  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: '2f9b8637-de48-4c84-a2dc-2149f4bc8c89',
    key: 324815,
    tag: '0.0.1',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: '65294735-5f37-414f-ba38-8e91fa3bfb3d',
    key: 354861,
    tag: '0.0.2',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: 'b8a76b76-a559-4d48-893c-8781a4f9d043',
    key: 356124,
    tag: '0.3',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: '9c521021-ff54-4b5b-a51c-ddc86906afe8',
    key: 384576,
    tag: '0.4.0',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: '97f6303e-ea3b-4bf9-b3cc-025ed3476be2',
    key: 458942,
    tag: '0.4.5',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: 'f21db1fe-938a-47c9-81dd-3049d671f80a',
    key: 481245,
    tag: '0.5',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: '34683670-b589-49d2-923d-857e753bc76e',
    key: 532486,
    tag: '0.55',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '14f2dc0d-9648-498e-b06e-a8479e0a7b26',
    id: 'e364398a-8604-4601-8ab8-079816624653',
    key: 541867,
    tag: '1.0.0',
    updated_at: new Date()
  })

  // Code Versions
  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: 'b353ee74-596a-4ec8-8b1c-11589bb8eb36',
    id: 'ad09512f-91a3-451e-8b9c-462f4a42df88',
    key: 451874,
    tag: '0.1',
    updated_at: new Date()
  })

  // Terminal Versions
  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '274b1d3e-85bd-4ee4-88d9-5ec18f4e87c4',
    id: '0876e8a5-6f23-4c3e-a061-5eb3c8da5d33',
    key: 381275,
    tag: '1.0.0',
    updated_at: new Date()
  })

  await knex('github_releases').insert({
    created_at: new Date(),
    deleted_at: null,
    github_repository: '274b1d3e-85bd-4ee4-88d9-5ec18f4e87c4',
    id: '99b0b6ac-bdce-4ad6-aea0-7e471719d616',
    key: 687512,
    tag: '2.0.0',
    updated_at: new Date()
  })
}
