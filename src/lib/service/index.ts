/**
 * houston/src/lib/service/index.ts
 * Entry file to all of the fun third party services we interact with
 */

import * as type from './type'

import { GitHub } from './github'

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
  ICodeRepositoryFactory,
  ILog,
  IPackage,
  IPackageRepository,
  IServiceIds
} from './type'

export { Aptly } from './aptly'
export { github, IGitHubFactory } from './github'

export const codeRepository = Symbol('codeRepository')
export const packageRepository = Symbol('packageRepository')
export const logRepository = Symbol('logRepository')

export const codeRepositoryFactory = Symbol('codeRepositoryFactory')
