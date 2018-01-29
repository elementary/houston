/**
 * houston/src/lib/utility/faker/type.d.ts
 * Extending more Faker interfaces
 */

/// <reference types="Faker" />

declare const fakerConstructor: Faker.Constructor

declare namespace Faker {
  interface Constructor {
    new (opts?: ConstructorOptions): Faker.FakerStatic
  }

  interface ConstructorOptions {
    locales?: object
    locale?: string
    localeFallback?: string
  }
}

declare module 'faker/lib/index' {
  export = fakerConstructor
}
