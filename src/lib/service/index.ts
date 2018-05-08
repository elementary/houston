/**
 * houston/src/lib/service/index.ts
 * Entry file to all of the fun third party services we interact with
 */

import * as type from './type'

import { GitHub } from './github'

/**
 * Creates a new repository service given any URL
 * TODO: Add more repository services besides GitHub
 *
 * @param {string} url
 * @return {Repository}
 */
export function codeRepository (url: string): type.ICodeRepository {
  return new GitHub(url)
}

export { Aptly } from './aptly'
export { GitHub } from './github'

export { ICodeRepository, IPackageRepository } from './type'
