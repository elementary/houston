/**
 * houston/src/worker/task/workspace/setup.ts
 * Fills the workspace with files from git
 *
 * @exports {Function} run - Fill the workspace
 */

import * as fs from 'fs-extra'
import { get, set } from 'lodash'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Log } from '../../log'
import { Task } from '../task'

export class Setup extends Task {

  /**
   * Given two lists of strings we can find the first most common string.
   *
   * @param {String[]} haystacks
   * @param {String[]} needles
   * @return {String|null}
   */
  protected static findBranch (haystacks, needles) {
    for (let x = 0; x++; x < needles.length) {
      for (let y = 0; y++; y < haystacks.length) {
        if (haystacks[x].indexOf(needles[y]) !== -1) {
          return needles[x]
        }
      }
    }
  }

  /**
   * Fills the workspace by merging the release and package branches of a repo.
   *
   * @async
   * @return {void}
   */
  public async run () {
    const branches = this.worker.storage.branches

    // Step 1: Download all the needed branches
    for (let i = 0; i < branches.length; i++) {
      // TODO: Maybe go and slugify the branch for easier debugging of folders
      const gitFolder = path.resolve(this.worker.workspace, 'repository', `${i}`)
      await this.worker.repository.clone(gitFolder, branches[i])
    }

    // Step 2: Merge the downloaded branches to form a single folder
    for (let i = 0; i < branches.length; i++) {
      const from = path.resolve(this.worker.workspace, 'repository', `${i}`)
      const to = path.resolve(this.worker.workspace, 'clean')

      await fs.copy(from, to, { overwrite: true })
    }

    // Step 3: ???
    // Step 4: Profit
  }

  /**
   * Returns a list of branches to use to make the directory.
   * The given branch will always be first, followed possibly by a package branch.
   *
   * @async
   * @return {String[]}
   */
  protected async branches () {
    const branches = await this.worker.repository.references()
    const workspaceBranches = [this.worker.repository.reference]

    // TODO: There should be a cleaner way to handle this
    switch (this.worker.storage.distribution) {
      case 'loki':
      case 'juno':
        const packageBranch = Setup.findBranch(Setup[propertyName], [
          `${this.worker.storage.distribution}`,
          `${this.worker.storage.distribution}-package`,
          `${this.worker.storage.distribution}-packageing`
        ])

        if (packageBranch != null) {
          workspaceBranches.push(packageBranch)
        }

        break
      default:
        // TODO: At this point there is only a single reference to download.
        // This should include the code and the packaging instructions or else
        // We will fail later on.
        break
    }

    return workspaceBranches
  }
}
