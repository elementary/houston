/**
 * houston/src/lib/database/seed/008-releases.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the releases table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the releases table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('releases').del()

  // Keymaker releases
  await knex('releases').insert({
    created_at: new Date(1),
    id: '6fea3714-60cb-45f8-b56e-760745cfd95c',
    project_id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    releaseable_id: 'fed7651d-be81-4035-98bd-efa08e95a948',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '0.0.1',
    version_major: 0,
    version_minor: 0,
    version_patch: 1
  })

  await knex('releases').insert({
    created_at: new Date(2),
    id: 'acc81084-5759-493a-b9d7-969edc69d913',
    project_id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    releaseable_id: 'b1a4e61c-d10b-4bcd-b18a-f7469bfd4df1',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '0.0.2',
    version_major: 0,
    version_minor: 0,
    version_patch: 2
  })

  await knex('releases').insert({
    created_at: new Date(3),
    id: '6f3b3345-1b6d-457a-b6ca-5b5a067c4d6c',
    project_id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71',
    releaseable_id: '01645e34-1f00-4416-9734-030ea5dd9b48',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '0.0.3',
    version_major: 0,
    version_minor: 0,
    version_patch: 3
  })

  // AppCenter releases
  await knex('releases').insert({
    created_at: new Date(4),
    id: '3d49def5-779a-4e2b-9e8e-2ededdbd9bbe',
    project_id: '75fa37dc-888d-4905-97bd-73cc9e39be2a',
    releaseable_id: '2f9b8637-de48-4c84-a2dc-2149f4bc8c89',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '0.0.1',
    version_major: 0,
    version_minor: 0,
    version_patch: 1
  })

  await knex('releases').insert({
    created_at: new Date(5),
    id: '762b072f-2c15-4413-9ab8-8e878a9e47ed',
    project_id: '75fa37dc-888d-4905-97bd-73cc9e39be2a',
    releaseable_id: '65294735-5f37-414f-ba38-8e91fa3bfb3d',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '0.0.2',
    version_major: 0,
    version_minor: 0,
    version_patch: 2
  })

  await knex('releases').insert({
    created_at: new Date(6),
    id: '393c3985-f743-4daf-b868-73ce6458f4e0',
    project_id: '75fa37dc-888d-4905-97bd-73cc9e39be2a',
    releaseable_id: '9c521021-ff54-4b5b-a51c-ddc86906afe8',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '0.4.0',
    version_major: 0,
    version_minor: 4,
    version_patch: 0
  })

  await knex('releases').insert({
    created_at: new Date(7),
    id: '9e889f37-370f-4929-a12d-50faa53bb225',
    project_id: '75fa37dc-888d-4905-97bd-73cc9e39be2a',
    releaseable_id: '97f6303e-ea3b-4bf9-b3cc-025ed3476be2',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '0.4.5',
    version_major: 0,
    version_minor: 4,
    version_patch: 5
  })

  await knex('releases').insert({
    created_at: new Date(8),
    id: '79988df7-60c8-4356-acef-745b8108dfa4',
    project_id: '75fa37dc-888d-4905-97bd-73cc9e39be2a',
    releaseable_id: 'e364398a-8604-4601-8ab8-079816624653',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '1.0.0',
    version_major: 1,
    version_minor: 0,
    version_patch: 0
  })

  // Terminal Versions
  await knex('releases').insert({
    created_at: new Date(9),
    id: '1dc97f10-9de5-4c99-808a-0364939d6a96',
    project_id: '4a9e027d-c27e-483a-a0fc-b2724a19491b',
    releaseable_id: '0876e8a5-6f23-4c3e-a061-5eb3c8da5d33',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '1.0.0',
    version_major: 1,
    version_minor: 0,
    version_patch: 0
  })

  await knex('releases').insert({
    created_at: new Date(10),
    id: '877b86e8-9b96-4bf7-8243-fe1905cdd00f',
    project_id: '4a9e027d-c27e-483a-a0fc-b2724a19491b',
    releaseable_id: '99b0b6ac-bdce-4ad6-aea0-7e471719d616',
    releaseable_type: 'github',
    updated_at: new Date(),
    version: '2.0.0',
    version_major: 2,
    version_minor: 0,
    version_patch: 0
  })
}
