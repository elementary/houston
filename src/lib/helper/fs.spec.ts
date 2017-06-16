/**
 * houston/src/lib/helper/fs.spec.ts
 * Some filesystem helpers
 */

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as uuid from 'uuid/v4'

import * as fsHelper from './fs'

/**
 * mkdir
 * Makes a directory but promisified
 *
 * @async
 * @param {string} p - The path to create
 * @return {void}
 */
const mkdir = (p: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.mkdir(p, (err) => {
      if (err != null) {
        return reject(err)
      }

      return resolve()
    })
  })
}

/**
 * rmdir
 * Removes a directory but promisified
 *
 * @async
 * @param {string} p - The path to remove
 * @return {void}
 */
const rmdir = (p: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.rmdir(p, (err) => {
      if (err != null) {
        return reject(err)
      }

      return resolve()
    })
  })
}

test('mkdirp can create deep recursive folders', async () => {
  const id = uuid()
  const rootFolder = path.resolve(os.tmpdir(), 'houston-test')
  const folder = path.resolve(os.tmpdir(), 'houston-test', id, id, id)

  await fsHelper.mkdirp(folder)

  const stat = await new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(folder, (err, status) => {
      if (err != null) {
        return reject(err)
      }

      return resolve(status)
    })
  })

  expect(stat.isDirectory()).toBeTruthy()

  await rmdir(path.resolve(rootFolder, id, id, id))
  await rmdir(path.resolve(rootFolder, id, id))
  await rmdir(path.resolve(rootFolder, id))
})

test('rmp can recursivly remove folders', async () => {
  const id = uuid()
  const rootFolder = path.resolve(os.tmpdir(), 'houston-test')
  const folder = path.resolve(os.tmpdir(), 'houston-test', id)

  await mkdir(path.resolve(rootFolder, id))
  await mkdir(path.resolve(rootFolder, id, id))
  await mkdir(path.resolve(rootFolder, id, id, id))

  await fsHelper.rmp(folder)

  await new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(folder, (err, status) => {
      if (err == null) {
        return reject('Folder still exists')
      }

      return resolve()
    })
  })
})
