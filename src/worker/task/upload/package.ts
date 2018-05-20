/**
 * houston/src/worker/task/upload/index.ts
 * Responsible for uploading all the end results to third party services
 */

import { Task } from '../task'

import {
  IPackage,
  IPackageRepository,
  isPackageRepository,
  packageRepository
} from '../../../lib/service'

export class UploadPackage extends Task {
  /**
   * Uploads all of the packages to third party services
   *
   * @async
   * @return {void}
   */
  public async run () {
    if (this.worker.context.package == null || this.worker.context.package.path == null) {
      return
    }

    const pkg = this.worker.context.package as IPackage
    const ref = this.worker.context.references[0]

    pkg.name = 'testing'
    pkg.description = 'package description here'

    if (isPackageRepository(this.worker.repository)) {
      await this.worker.repository.uploadPackage(pkg, 'review', ref)
    }

    const codeRepositories = this.worker.app.getAll<IPackageRepository>(packageRepository)

    for (const repo of codeRepositories) {
      await repo.uploadPackage(pkg, 'review', ref)
    }
  }
}
