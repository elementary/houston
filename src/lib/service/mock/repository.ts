/**
 * houston/src/lib/service/mock/repository.ts
 * A mock repository used for testing.
 */

import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import { Repository as RepositoryInterface } from '../base/repository'
import { sanitize } from '../rdnn'

export class Repository implements RepositoryInterface {

  /**
   * The repository url
   *
   * @var {string}
   */
  public url: string

  /**
   * Creates a new GitHub Repository
   *
   * @param {string} url - The full github url
   */
  constructor (url: string) {
    this.url = url
  }

  /**
   * Returns the default RDNN value for this repository
   *
   * @return {string}
   */
  public get rdnn () {
    const [host, ...paths] = this.url.split('://')[1].split('/')

    const h = host.split('.').reverse().join('.')
    const p = paths.join('.')

    return sanitize(`${h}${p}`)
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
  public async clone (p: string, reference): Promise<void> {
    throw new Error('Unimplimented in mock repository')
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
    return []
  }
}
