/**
 * houston/src/lib/service/repository.ts
 * Creates a new repository service given a URL
 */

import { Repository } from './base/repository'

import { Repository as GitHub } from './github/repository'

/**
 * Creates a new repository service given any URL
 * TODO: Add more repository services besides GitHub
 *
 * @param {string} url
 * @return {Repository}
 */
export function create (url: string): Repository {
  return new GitHub(url)
}
