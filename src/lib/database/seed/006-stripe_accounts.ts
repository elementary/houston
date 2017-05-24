/**
 * houston/src/lib/database/seed/006-stripe_accounts.ts
 * Seeds the database
 *
 * @exports {Function} seed - Seeds the Stripe accounts table
 */

import * as Knex from 'knex'

/**
 * seed
 * Seeds the Stripe accounts table
 *
 * @param {Object} knex - An initalized Knex package
 */
export async function seed (knex: Knex) {
  await knex('stripe_accounts').del()

  await knex('stripe_accounts').insert({
    color: 'FFA500',
    created_at: new Date(),
    id: '326599e7-97ed-455a-9c38-122651a12be6',
    key: 4235823,
    name: 'btkostner',
    public_key: 'pk_test_uj0fjv0a9u9302fawfa2rasd',
    secret_key: 'sk_test_j89j2098vah803cnb83v298r',
    updated_at: new Date(),
    url: 'https://btkostner.io',
    user_id: '24ef2115-67e7-4ea9-8e18-ae6c44b63a71'
  })
}
