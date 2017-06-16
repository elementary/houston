/**
 * houston/src/lib/helper/fs.ts
 * Some filesystem helpers
 */

import * as fs from 'fs'
import * as path from 'path'

/**
 * folderExists
 * Checks if a folder exists
 *
 * @async
 * @param {string} path - The directory to check
 * @return {boolean}
 */
export async function folderExists (p: string) {
  const folder = path.normalize(p)

  try {
    const stat = await new Promise<fs.Stats>((resolve, reject) => {
      fs.stat(folder, (err, status) => {
        if (err != null) {
          return reject(err)
        }

        return resolve(status)
      })
    })

    return stat.isDirectory()
  } catch (e) {
    return false
  }
}

/**
 * mkdirp
 * Recursivly makes a directory
 *
 * @async
 * @param {string} path - The path to create
 * @return {void}
 */
export async function mkdirp (p: string) {
  const folder = path.normalize(p)
  const parent = path.dirname(folder)

  const parentExists = await folderExists(parent)
  if (parentExists === false) {
    await mkdirp(parent)
  }

  const exists = await folderExists(folder)
  if (exists === true) {
    return
  }

  await new Promise((resolve, reject) => {
    fs.mkdir(folder, (err) => {
      if (err != null) {
        return reject(err)
      }

      return resolve()
    })
  })
}

/**
 * rmp
 * Recursivly deletes a directory and all of the files inside.
 *
 * @async
 * @param {string} path - The directory to remove
 * @return {void}
 */
export async function rmp (p: string) {
  const folder = path.normalize(p)

  const contents = await new Promise<string[]>((resolve, reject) => {
    fs.readdir(folder, (err, files) => {
      if (err != null) {
        return reject(err)
      }

      return resolve(files)
    })
  })

  const promises = contents.map((contentPath) => {
    return rmp(path.resolve(folder, contentPath))
  })

  await Promise.all(promises)

  const stat = await new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(folder, (err, status) => {
      if (err != null) {
        return reject(err)
      }

      return resolve(status)
    })
  })

  if (stat.isDirectory()) {
    await new Promise((resolve, reject) => {
      fs.rmdir(folder, (err) => {
        if (err != null) {
          return reject(err)
        }

        return resolve()
      })
    })
  }

  if (stat.isFile()) {
    await new Promise((resolve, reject) => {
      fs.unlink(folder, (err) => {
        if (err != null) {
          return reject(err)
        }

        return resolve()
      })
    })
  }
}
