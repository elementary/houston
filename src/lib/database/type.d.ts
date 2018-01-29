/**
 * houston/src/lib/database/type.d.ts
 * Extending more Knex interfaces
 */

/// <reference types="Knex" />

declare const knexQueryBuilderConstructor: Knex.QueryBuilderConstructor

declare namespace Knex {
  interface QueryBuilderConstructor {
    new (client: Knex.Client): Knex.QueryBuilder
  }
}

declare module 'knex/lib/query/builder' {
  export = knexQueryBuilderConstructor
}
