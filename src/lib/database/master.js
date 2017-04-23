/**
 * src/lib/database/master.js
 * Master class all database models inherit from
 *
 * @exports {Class} default - a class for all other models to inherit from
 * @exports {Type} status - All types a Project could be in
 */

import db from './connection'

export type status = 'NEW' | 'STANDBY' | 'QUEUE' | 'RUN' | 'REVIEW' | 'FINISH' | 'DEFER' | 'ERROR'

/**
 * Master
 * a class for all other models to inherit from
 */
export default class Master extends db.Model {

  /**
   * sanatizeString
   * Cleans input from public before entering the database
   *
   * @see https://github.com/vkarpov15/mongo-sanitize/blob/master/index.js
   *
   * @param {*} i - input to sanatize
   * @returns {String} - sanatized output able to be pluged into a query
   */
  static sanatize (i) {
    if (i instanceof Object) {
      Object.keys(i).forEach((key) => {
        if (/^\$/.test(key)) {
          delete i[key]
        }
      })
    }

    return i
  }
}
