/**
 * houston/src/lib/service/github.ts
 * Handles interaction with GitHub repositories.
 */

import * as fileType from 'file-type'
import * as fs from 'fs-extra'
import * as Git from 'nodegit'
import * as os from 'os'
import * as path from 'path'
import * as agent from 'superagent'
import * as uuid from 'uuid/v4'

import { sanitize } from '../utility/rdnn'
import * as type from './type'

export class GitHub implements type.ICodeRepository, type.IPackageRepository {

  /**
   * tmpFolder
   * Folder to use as scratch space for cloning repos
   *
   * @var {string}
   */
  protected static tmpFolder = path.resolve(os.tmpdir(), 'houston')

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
   * @param {string} url - The full github url
   */
  constructor (url: string) {
    this.url = url
  }

  /**
   * url
   * Returns the Git URL for the repository
   *
   * @return {string}
   */
  public get url (): string {
    if (this.auth != null) {
      return `https://${this.auth}@github.com/${this.username}/${this.repository}.git`
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

    const chunks = p.split(/[@\/:\.]/)
    const reverseChunks = [...chunks].reverse()

    if (reverseChunks[0].toLowerCase() === 'git') {
      this.username = reverseChunks[2]
      this.repository = reverseChunks[1]
    } else {
      this.username = reverseChunks[1]
      this.repository = reverseChunks[0]
    }

    if (chunks[0].toLowerCase() === 'https' || chunks[0].toLowerCase() === 'http') {
      if (chunks[3].toLowerCase() !== 'github') {
        this.auth = chunks[3]
      }
    }
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
    const p = path.resolve(GitHub.tmpFolder, uuid())
    const repo = await Git.Clone(this.url, p)

    const branches = await repo.getReferenceNames(Git.Reference.TYPE.LISTALL)

    await fs.remove(p)

    return branches
  }

  /**
   * Uploads an asset to a GitHub release.
   *
   * @async
   * @param {string} p Path to the asset file
   * @param {string} name
   * @param {string} [description]
   * @param {string} [reference]
   * @return {void}
   */
  public async uploadPackage (p: string, name: string, description: string, reference?: string) {
    const url = `${this.username}/${this.repository}/releases/tags/${reference}`
    const { body } = await agent
      .get(`https://api.github.com/repos/${url}`)
      .set('accept', 'application/vnd.github.v3+json')
      .set('authorization', `token ${this.auth}`)

    if (body.upload_url == null) {
      throw new Error('No Upload URL for GitHub release')
    }

    // TODO: Should we remove existing assets that would conflict?

    const mime = await GitHub.getFileType(p)
    const stat = await fs.stat(p)
    const file = await fs.createReadStream(p)

    await new Promise((resolve, reject) => {
      const res = agent
        .post(body.upload_url.replace('{?name,label}', ''))
        .set('content-type', mime)
        .set('content-length', stat.size)
        .set('authorization', `token ${this.auth}`)
        .query({ name })
        .query((description != null) ? { label: description } : {})
        .on('error', reject)
        .on('end', resolve)

      file.pipe(res)
    })
  }

}
