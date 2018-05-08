/**
 * houston/src/lib/service/aptly/package-repo.ts
 * Class for aptly package stuff
 */

import { Config } from '../config'
import * as type from './type'

export class Aptly implements type.IPackageRepository {
  /**
   * The application configuration
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * Creates a new aptly package repository
   *
   * @param {Config} config
   */
  constructor (config: Config) {
    this.config = config
  }

  /**
   * Takes a full path to file and uploads it to a package repository
   *
   * @param {String} p The full path to the asset
   * @param {String} name The human readable name of the file
   * @param {String} description A human readable description of the file
   * @param {String} [reference] A code-repository reference that this file was from
   * @return {void}
   */
  public async uploadPackage (p: string, name: string, description: string, reference?: string) {
    return
  }
}
