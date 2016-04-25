/**
 * lib/grid.js
 * Handles files with mongoose using gtidfs
 *
 * @exports {Function} get - gets a file
 * @exports {Function} create - creates a file
 */

import db from './database'

/**
 * get
 * returns a file from database
 *
 * @param {ObjectId} id - file identifier
 * @return {Object} - {
 *   {Buffer} buffer - file buffer
 *   {Object} metadata - metadata saved with file
 * }
 */
export function get (id) {
  if (!db.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ObjectId')
  }

  const store = new db.mongo.GridStore(db.connection.db, id, 'r')

  return new Promise((resolve, reject) => {
    store.open((error, gs) => {
      if (error) reject(error)

      gs.seek(0, () => {
        gs.read((error, buffer) => {
          if (error) reject(error)

          gs.close((error) => {
            if (error) reject(error)

            resolve({ buffer, metadata: gs.metadata })
          })
        })
      })
    })
  })
}

/**
 * create
 * creates a file in the database
 *
 * @param {Buffer} file - buffer of file to save
 * @param {Object} metadata - any other data to save with file
 * @return {ObjectId} - file id
 */
export function create (file, metadata) {
  const name = new db.Types.ObjectId()
  const store = new db.mongo.GridStore(db.connection.db, name, 'w', { metadata })

  return new Promise((resolve, reject) => {
    store.open((error, gs) => {
      if (error) reject(error)

      gs.write(file, (error, gs) => {
        if (error) reject(error)

        gs.close((error) => {
          if (error) reject(error)

          resolve(name)
        })
      })
    })
  })
}
