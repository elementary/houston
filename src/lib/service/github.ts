/**
 * houston/src/lib/service/github.ts
 * Handles interaction with GitHub repositories.
 */

import * as URL from 'url'

import * as fileType from 'file-type'
import * as fs from 'fs-extra'
import { injectable } from 'inversify'
import * as Git from 'nodegit'
import * as os from 'os'
import * as path from 'path'
import * as agent from 'superagent'
import * as uuid from 'uuid/v4'

import { Config } from '../config'
import { sanitize } from '../utility/rdnn'
import * as type from './type'

export const github = Symbol('GitHub')
export type IGitHubFactory = (url: string) => GitHub

@injectable()
export class GitHub implements type.ICodeRepository, type.IPackageRepository, type.ILogRepository {
  /**
   * tmpFolder
   * Folder to use as scratch space for cloning repos
   *
   * @var {string}
   */
  public tmpFolder = path.resolve(os.tmpdir(), 'houston')

  /**
   * The human readable name of the service.
   *
   * @var {String}
   */
  public serviceName = 'GitHub'

  /**
   * username
   * The GitHub username or organization.
   *
   * @var {string}
   */
  public username: string

  /**
   * repository
   * The GitHub user's repository name
   *
   * @var {string}
   */
  public repository: string

  /**
   * auth
   * Authentication to use when interacting
   *
   * @var {string}
   */
  public auth?: string

  /**
   * reference
   * The reference to branch or tag.
   *
   * @var {string}
   */
  public reference = 'refs/heads/master'

  /**
   * config
   * The application configuration
   *
   * @var {Config}
   */
  protected config: Config

  /**
   * Tries to get the file mime type by reading the first chunk of a file.
   * Required by GitHub API
   *
   * Code taken from examples of:
   * https://github.com/sindresorhus/file-type
   * https://github.com/sindresorhus/read-chunk/blob/master/index.js
   *
   * @async
   * @param {String} p Full file path
   * @return {String} The file mime type
   */
  protected static async getFileType (p: string): Promise<string> {
    const buffer = await new Promise((resolve, reject) => {
      fs.open(p, 'r', (openErr, fd) => {
        if (openErr != null) {
          return reject(openErr)
        }

        fs.read(fd, Buffer.alloc(4100), 0, 4100, 0, (readErr, bytesRead, buff) => {
          fs.close(fd)

          if (readErr != null) {
            return reject(readErr)
          }

          if (bytesRead < 4100) {
            return resolve(buff.slice(0, bytesRead))
          } else {
            return resolve(buff)
          }
        })
      })
    })

    return fileType(buffer).mime
  }

  /**
   * Creates a new GitHub Repository
   *
   * @param {Config} config - The application configuration
   */
  constructor (config: Config) {
    this.config = config
  }

  /**
   * url
   * Returns the Git URL for the repository
   *
   * @return {string}
   */
  public get url (): string {
    if (this.auth != null) {
      return `https://x-access-token:${this.auth}@github.com/${this.username}/${this.repository}.git`
    }

    return `https://github.com/${this.username}/${this.repository}.git`
  }

  /**
   * url
   * Sets the Git URL for the repository
   * NOTE: Auth code is case sensitive, so we can't lowercase the whole url
   *
   * @return {string}
   */
  public set url (p: string) {
    if (p.indexOf('github') === -1) {
      throw new Error('Given URL is not a GitHub repository')
    }

    // NOTE: This is A+ 10/10 string logic. Will not break ever.
    const httpPath = (p.startsWith('git@') ? p.replace('git@', 'https://') : p)
      .replace('://github.com:', '://github.com/')
      .replace(/\.git$/, '')

    const url = new URL.URL(httpPath)
    const [, username, repository] = url.pathname.split('/')

    this.username = username
    this.repository = repository
    this.auth = url.password || url.username || null
  }

  /**
   * Returns the default RDNN value for this repository
   *
   * @return {string}
   */
  public get rdnn () {
    return sanitize(`com.github.${this.username}.${this.repository}`)
  }

  /**
   * clone
   * Clones the repository to a folder
   *
   * @async
   * @param {string} p - The path to clone to
   * @param {string} [reference] - The branch to clone
   * @return {void}
   */
  public async clone (p: string, reference = this.reference): Promise<void> {
    const repo = await Git.Clone(this.url, p)
    const ref = await Git.Reference.lookup(repo, reference)

    await repo.checkoutRef(ref)

    await this.recursiveClone(p)

    await fs.remove(path.resolve(p, '.git'))
  }

  /**
   * references
   * Returns a list of references this repository has
   * TODO: Try to figure out a more optimized way
   *
   * @async
   * @return {string[]}
   */
  public async references (): Promise<string[]> {
    const p = path.resolve(this.tmpFolder, uuid())
    const repo = await Git.Clone(this.url, p)

    const branches = await repo.getReferenceNames(Git.Reference.TYPE.LISTALL)

    await fs.remove(p)

    return branches
  }

  /**
   * Uploads an asset to a GitHub release.
   *
   * @async
   * @param {IPackage} pkg Package to upload
   * @param {IStage} stage
   * @param {string} [reference]
   * @return {IPackage}
   */
  public async uploadPackage (pkg: type.IPackage, stage: type.IStage, reference?: string) {
    if (pkg.githubId != null) {
      return pkg
    }

    return pkg

    const url = `${this.username}/${this.repository}/releases/tags/${reference}`
    const { body } = await agent
      .get(`https://api.github.com/repos/${url}`)
      .set('accept', 'application/vnd.github.v3+json')
      .set('authorization', `Bearer ${this.auth}`)

    if (body.upload_url == null) {
      throw new Error('No Upload URL for GitHub release')
    }

    // TODO: Should we remove existing assets that would conflict?
    const mime = await GitHub.getFileType(pkg.path)
    const stat = await fs.stat(pkg.path)
    const file = await fs.createReadStream(pkg.path)

    const res = await new Promise((resolve, reject) => {
      let data = ''

      const req = agent
        .post(body.upload_url.replace('{?name,label}', ''))
        .set('content-type', mime)
        .set('content-length', stat.size)
        .set('authorization', `token ${this.auth}`)
        .query({ name: pkg.name })
        .query((pkg.description != null) ? { label: pkg.description } : {})
        .parse((response, fn) => {
          response.on('data', (chunk) => { data += chunk })
          response.on('end', fn)
        })
        .on('error', reject)
        .on('end', (err, response) => {
          if (err != null) {
            return reject(err)
          }

          try {
            return resolve(JSON.parse(data))
          } catch (err) {
            return reject(err)
          }
        })

      file
        .pipe(req)
        .on('error', reject)
        .on('close', () => resolve(data))
    })

    return { ...pkg }
  }

  /**
   * Uploads a log to GitHub as an issue witht he 'AppCenter' label
   *
   * @async
   * @param {ILog} log
   * @param {IStage} stage
   * @param {string} [reference]
   * @return {ILog}
   */
  public async uploadLog (log: type.ILog, stage: type.IStage, reference?: string): Promise<type.ILog> {
    if (log.githubId != null) {
      return
    }

    const hasLabel = await agent
      .get(`https://api.github.com/repos/${this.username}/${this.repository}/labels/AppCenter`)
      .set('authorization', `Bearer ${this.auth}`)
      .then(() => true)
      .catch(() => false)

    if (!hasLabel) {
      await agent
        .post(`https://api.github.com/repos/${this.username}/${this.repository}/labels`)
        .set('authorization', `Bearer ${this.auth}`)
        .send({
          color: '4c158a',
          description: 'Issues related to releasing on AppCenter',
          name: 'AppCenter'
        })
    }

    const { body } = await agent
      .post(`https://api.github.com/repos/${this.username}/${this.repository}/issues`)
      .set('authorization', `Bearer ${this.auth}`)
      .send({
        body: log.body,
        labels: ['AppCenter'],
        title: log.title
      })

    return { ...log, githubId: body.id }
  }
  
  /**
   * Clones all of the Git submodules for a given repo path
   *
   * @async
   * @param {String} clonePath - Path of the repository
   * @return {void}
   */
  protected async recursiveClone (clonePath) {
    const repo = await Git.Repository.open(clonePath)

    await Git.Submodule.foreach(repo, async (submodule) => {
      await submodule.update(1, new Git.SubmoduleUpdateOptions())
      await this.recursiveClone(path.join(clonePath, submodule.path()))
    })
  }
}
