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
export function createCodeRepository (url: string): type.ICodeRepository {
  return new GitHub(url)
}

// Typescript typeguard to ensure given value is an ICodeRepository
export function isCodeRepository (value): value is type.ICodeRepository {
  return (value != null && typeof value.clone === 'function')
}

// Typescript typeguard to ensure given value is an IPackageRepository
export function isPackageRepository (value): value is type.IPackageRepository {
  return (value != null && typeof value.uploadPackage === 'function')
}

// Typescript typeguard to ensure given value is an ILogRepository
export function isLogRepository (value): value is type.ILogRepository {
  return (value != null && typeof value.uploadLog === 'function')
}

export {
  ICodeRepository,
  ILog,
  IPackage,
  IPackageRepository,
  IServiceIds
} from './type'

export { Aptly } from './aptly'
export { GitHub } from './github'

export const codeRepository = Symbol('codeRepository')
export const packageRepository = Symbol('packageRepository')
export const logRepository = Symbol('logRepository')
