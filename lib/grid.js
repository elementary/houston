/**
 * lib/grid.js
 * Handles files with mongoose using gtidfs
 *
 * @exports {Function} get - gets a file
 * @exports {Function} create - creates a file
 */

import db from './db'

/**
 * get
 * returns a file from database
 *
 * @param {String} file - name of file to return
 * @return {Object} - file metadata and buffer
 */
export function get (file) {
  const store = new db.mongo.GridStore(db.connection.db, file, 'r')

  return new Promise((resolve, reject) => {
    store.open((error, gs) => {
      if (error) reject(error)

      gs.seek(0, () => {
        gs.read((error, buffer) => {
          if (error) reject(error)

          resolve(Object.assign(gs.metadata, { buffer }))
        })
      })
    })
  })
}

/**
 * create
 * creates a file in the database
 *
 * @param {String} name - name of file to save
 * @param {Buffer} file - buffer of file to save
 * @param {String} type - mimetype of file
 * @param {Object} metadata - any other data to save with file
 * @return {Object} - file metadata and buffer
 */
export function create (name, file, type = 'text/plain', metadata) {
  const store = new db.mongo.GridStore(db.connection.db, file, 'w', { type, metadata })

  return new Promise((resolve, reject) => {
    store.open((error, gs) => {
      if (error) reject(error)

      gs.write(file, (error, gs) => {
        if (error) reject(error)

        resolve()
      })
    })
  })
}
