/**
 * houston/test/utility/worker/repository.ts
 * A third party repository that implements all of our needed interfaces.
 * Used for testing without any side effects.
 */

import * as type from '../../../src/lib/service/type'
import { sanitize } from '../../../src/lib/utility/rdnn'

export class Repository implements type.ICodeRepository, type.IPackageRepository, type.ILogRepository {
  public url: string

  public serviceName = 'mock Repository'

  constructor (url: string) {
    this.url = url
  }

  public get rdnn () {
    const [host, ...paths] = this.url.split('://')[1].split('/')

    const h = host.split('.').reverse().join('.')
    const p = paths.join('.')

    return sanitize(`${h}${p}`)
  }

  public async clone (p: string, reference): Promise<void> {
    throw new Error('Unimplimented in mock repository')
  }

  public async references (): Promise<string[]> {
    return ['refs/origin/master']
  }

  public async uploadPackage (pkg: type.IPackage, stage: type.IStage, reference?: string): Promise<type.IPackage> {
    throw new Error('Unimplimented in mock repository')
  }

  public async uploadLog (log: type.ILog, stage: type.IStage, reference?: string): Promise<type.ILog> {
    throw new Error('Unimplimented in mock repository')
  }
}
