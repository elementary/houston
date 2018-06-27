/**
 * houston/src/worker/task/workspace/setup.ts
 * Fills the workspace with files from git
 */

import * as fs from 'fs-extra'
import { get, set } from 'lodash'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Log } from '../../log'
import { IWorker } from '../../type'
import { Task } from '../task'

/**
 * Everything that makes a build unique. All of these can be derived from
 * reference names in the repository.
 */
export interface IBuildConfiguration {
  architecture: string,
  distribution: string,
  packageType: string
}

/**
 * These are all possible types of outputs we can have. They are used for
 * generating possible reference names.
 *
 * @var {string[]}
 */
const POSSIBLE_ARCHITECTURES = ['amd64']
const POSSIBLE_DISTRIBUTIONS = ['loki', 'juno']
const POSSIBLE_PACKAGE_TYPES = ['deb']

/**
 * A list of default build setups if nothing else was found. This is left
 * mostly for people who have not updated there repo since old houston v1.
 *
 * @var {IBuildConfiguration[]}
 */
const DEFAULT_BUILDS: IBuildConfiguration[] = [{
  architecture: 'amd64',
  distribution: 'juno',
  packageType: 'deb'
}]

export class WorkspaceSetup extends Task {
  /**
   * Finds and creates all of the different build configurations
   *
   * @async
   * @return {void}
   */
  public async run () {
    await this.worker.emitAsync(`task:WorkspaceSetup:start`)

    for (const build of await this.possibleBuilds()) {
      await this.setupBuild(build)
    }

    await this.worker.emitAsync(`task:WorkspaceSetup:end`)
  }

  /**
   * Using all the possible combinations and repositories references we have,
   * this will generate a list of each package system, architecture, and
   * distribution we should build for.
   *
   * @async
   * @return {IBuildConfiguration[]}
   */
  public async possibleBuilds (): Promise<IBuildConfiguration[]> {
    const repositoryReferences = await this.worker.repository.references()
    const builds: IBuildConfiguration[] = []

    for (const packageType of POSSIBLE_PACKAGE_TYPES) {
      for (const architecture of POSSIBLE_ARCHITECTURES) {
        for (const distribution of POSSIBLE_DISTRIBUTIONS) {
          const foundReference = repositoryReferences
            .map((ref) => ref.split('/').reverse()[0])
            .find((ref) => (ref === `${packageType}-packaging-${distribution}`))

          if (foundReference != null) {
            builds.push({
              architecture,
              distribution,
              packageType
            })
          }
        }
      }
    }

    if (builds.length === 0) {
      builds.push(...DEFAULT_BUILDS)
    }

    return builds
  }

  /**
   * Returns a list of references to use for making the build.
   *
   * @async
   * @param {IBuildConfiguration} build
   * @return {String[]}
   */
  public async buildReferences (build: IBuildConfiguration): Promise<string[]> {
    const repositoryReferences = await this.worker.repository.references()

    const mergableReferences = [
      `${build.distribution}`,
      `${build.packageType}-packaging`,
      `${build.packageType}-packaging-${build.distribution}`
    ]

    // This allows us to add an `origin/heads/testing` reference to the build
    // And have a `deb-packaging-juno-testing` branch for packaging
    this.worker.context.references
      .map((ref) => ref.split('/').reverse()[0])
      .forEach((shortRef) => {
        mergableReferences.push(`${build.packageType}-packaging-${shortRef}`)
        mergableReferences.push(`${build.packageType}-packaging-${build.distribution}-${shortRef}`)
      })

    return mergableReferences
      .filter((ref) => repositoryReferences.includes(ref))
  }

  /**
   * Does the heavy lifting of forking the repo, and setting up the folders
   * with cloned and merged packaging.
   *
   * @async
   * @param {IBuildConfiguration} build
   * @return {void}
   */
  protected async setupBuild (build: IBuildConfiguration) {
    const basicFork = await this.worker.fork({
      architecture: build.architecture,
      distribution: build.distribution,
      package: { type: build.packageType }
    })

    const worker = await this.worker.emitAsyncChain<IWorker>(`task:WorkspaceSetup:fork`, basicFork)

    await fs.ensureDir(worker.workspace)
    const references = await this.buildReferences(build)

    // Step 1: Download all the needed references
    for (let i = 0; i < references.length; i++) {
      // TODO: Maybe go and slugify the branch for easier debugging of folders
      const gitFolder = path.resolve(worker.workspace, 'repository', `${i}`)
      await worker.repository.clone(gitFolder, references[i])
    }

    // Step 2: Merge the downloaded references to form a single folder
    for (let i = 0; i < references.length; i++) {
      const from = path.resolve(worker.workspace, 'repository', `${i}`)
      const to = path.resolve(worker.workspace, 'clean')

      await fs.copy(from, to, { overwrite: true })
    }

    // Step 3: Copy pasta to the dirty directory
    const clean = path.resolve(worker.workspace, 'clean')
    const dirty = path.resolve(worker.workspace, 'dirty')

    await fs.ensureDir(clean)
    await fs.ensureDir(dirty)
    await fs.copy(clean, dirty)

    // Step 4: Profit.
  }
}
