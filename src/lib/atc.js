/**
 * lib/atc.js
 * A message queue class based around mongodb
 *
 * @exports {Class} Worker - Works on items in a queue
 * @exports {Class} Sender - Adds items to worker queue
 */

import monq from 'monq'

import config from 'lib/config'

const client = monq(config.database)

/**
 * Worker
 * Works on items in a queue
 *
 * @extends monq.Worker
 *
 * @emits Worker#dequeued
 * @emits Worker#failed
 * @emits Worker#complete
 * @emits Worker#error
 */
export class Worker extends client.Worker {

  /**
   * Creates a queue worker
   *
   * @param {String} name - Message queue name
   * @param {Number} int - Time to check for new items in queue
   */
  constructor (name, int = 5000) {
    super([name], {
      collection: 'queue',
      interval: int
    })
  }

  /**
   * register
   * Registers a function for a particular job type
   *
   * @param {String} name - job name
   * @param {Function} fn - function to run given params, must return promise
   * @return {Void}
   */
  register (name, fn) {
    super({
      [name]: (param, callback) => {
        fn(param)
        .then((val) => callback(null, val))
        .catch((err) => callback(err))
      }
    })
  }
}

/**
 * Sender
 * Adds items to worker queue
 */
export class Sender extends client.Queue {

  /**
   * Creates a new queue sender
   *
   * @param {String} name - Message queue name
   */
  constructor (name) {
    super(client, name, {
      collection: 'queue'
    })
  }

  /**
   * enqueue
   * Adds an item to the queue
   *
   * @param {String} name - job name
   * @param {Object} param - job parameters
   * @param {Object} opt - options
   * @return {Object} - monq job object
   */
  enqueue (name, param, opt) {
    return new Promise((resolve, reject) => {
      super(name, param, opt, (err, job) => {
        if (err) return reject(err)
        return resolve(job)
      })
    })
  }
}
