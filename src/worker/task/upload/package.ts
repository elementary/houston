/**
 * houston/src/worker/task/upload/package.ts
 * Responsible for uploading all the end results to third party services
 */

import * as path from 'path'

import { Logger } from '../../../lib/log'
import { Log } from '../../log'
import { Task } from '../task'

import {
  IPackage,
  IPackageRepository,
  isPackageRepository,
  packageRepository
} from '../../../lib/service'

export class UploadPackage extends Task {
  /**
   * A list of collected errors we get from third party services.
   *
   * @var {Object[]}
   */
  protected errors: { error: Error, service: string }[] = []

  /**
   * Uploads all of the packages to third party services
   *
   * @async
   * @return {void}
   */
  public async run () {
    const packages = this.worker.result.packages

    for (const context of this.worker.contexts) {
      if (context.package == null) {
        continue
      }

      const ref = context.references[context.references.length - 1]

      context.package.name = `${context.nameHuman} ${context.version}`
      context.package.description = [
        context.nameDomain,
        context.architecture,
        context.distribution,
        context.version
      ].join(' ')

      context.package = await this.uploadToCodeRepository(context.package, ref)
      context.package = await this.uploadToPackageRepositories(context.package, ref)
    }

    if (this.errors.length !== 0) {
      this.reportErrors()
    }
  }

  /**
   * Uploads package to the origin code repository if it's also a package repo
   *
   * @async
   * @param {IPackage} pkg
   * @param {string} ref
   * @return {IPackage}
   */
  protected async uploadToCodeRepository (pkg, ref): Promise<IPackage> {
    if (!isPackageRepository(this.worker.repository)) {
      return
    }

    try {
      pkg = await this.worker.repository.uploadPackage(pkg, 'review', ref)
    } catch (error) {
      this.errors.push({ error, service: this.worker.repository.serviceName })
    }

    return pkg
  }

  /**
   * Uploads package to all known about package repositories
   *
   * @async
   * @param {IPackage} pkg
   * @param {string} ref
   * @return {IPackage}
   */
  protected async uploadToPackageRepositories (pkg, ref): Promise<IPackage> {
    // Prevents error when no packageRepository is not bound in tests or something
    if (!this.worker.app.isBound(packageRepository)) {
      return
    }

    const packageRepositories = this.worker.app.getAll<IPackageRepository>(packageRepository)

    for (const repo of packageRepositories) {
      try {
        pkg = await repo.uploadPackage(pkg, 'review', ref)
      } catch (error) {
        this.errors.push({ error, service: repo.serviceName })
      }
    }

    return pkg
  }

  /**
   * Concats all the errors we have and puts them to a nice markdown log.
   *
   * @throws {Log}
   */
  protected reportErrors () {
    const logger = this.worker.app.get<Logger>(Logger)
    this.errors.forEach((e) => {
      logger.error('Error uploading package')
        .setError(e.error)
        .send()
    })

    if (this.errors.length !== 0) {
      const logPath = path.resolve(__dirname, 'package.md')
      throw Log.template(Log.Level.ERROR, logPath, {
        services: this.errors.map((e) => e.service)
      })
    }
  }
}
