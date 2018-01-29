/**
 * houston/src/lib/utility/faker/type.ts
 * Some nice types for Faker
 */

export type FakerProvider = (faker: Faker.FakerStatic) => object

export const fakerProvider = Symbol.for('FakerProvider')
