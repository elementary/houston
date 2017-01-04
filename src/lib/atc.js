/**
 * lib/atc.js
 * A message queue class based around mongodb
 *
 * @exports {Class} Worker - Works on items in a queue
 * @exports {Class} Sender - Adds items to worker queue
 */

import events from 'events'
import monq from 'monq'

import config from 'lib/config'

const client = monq(config.get('database'))

/**
 * Worker
 * Works on items in a queue
 *
 * @extends EventEmitter
 *
 * @emits Worker#removed
 * @emits Worker#failed
 * @emits Worker#complete
 * @emits Worker#error
 */
export class Worker extends events.EventEmitter {

  /**
   * Creates a queue worker
   *
   * @param {String} name - Message queue name
   * @param {Number} int - Time to check for new items in queue
   */
  constructor (name, int = 5000) {
    super()

    this.worker = client.worker([name], {
      interval: int
    })
  }

  /**
   * start
   * Starts worker queue
   *
   * @returns {Void}
   */
  start () {
    this.worker.on('dequeued', (data) => this.emit('unqueued', data))
    this.worker.on('failed', (data) => this.emit('failed', data))
    this.worker.on('complete', (data) => this.emit('complete', data))
    this.worker.on('error', (err) => this.emit('error', err))

    this.worker.start()
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
    this.worker.register({
      [name]: (param, callback) => {
        fn(param)
        .then((data) => callback(null, data))
        .catch((err) => callback(err))
      }
    })
  }
}

/**
 * Sender
 * Adds items to worker queue
 */
export class Sender {

  /**
   * Creates a new queue sender
   *
   * @param {String} name - Message queue name
   */
  constructor (name) {
    this.queue = client.queue(name)
  }

  /**
   * get
   * Returns a job object in the queue
   *
   * @param {String} id - mongodb job id
   * @returns {Object} - a promise of the job object
   */
  get (id) {
    return new Promise((resolve, reject) => {
      this.queue.get(id, (err, obj) => {
        if (err) return reject(err)
        return resolve(obj.data)
      })
    })
  }

  /**
   * add
   * Adds an item to the queue
   *
   * @param {String} name - the job name
   * @param {Object} param - the job parameters
   * @returns {Object} - a promise of the job object
   */
  add (name, param) {
    return new Promise((resolve, reject) => {
      this.queue.enqueue(name, param, (err, job) => {
        if (err) return reject(err)
        return resolve(job.data)
      })
    })
  }
}
