/**
 * houston/src/lib/cache/type.d.ts
 * Types for the cache utility
 */

export const Cache = Symbol.for('Cache') // tslint:disable-line

export interface ICacheOptions {
  tty?: number
}

export interface ICache {
  get (key: string): Promise<string|null>
  set (key: string, value: string): Promise<void>
}

export type ICacheFactory = (namespace: string, options?: ICacheOptions) => ICache
