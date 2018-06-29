/**
 * houston/src/lib/utility/eventemitter.ts
 * An event emitter based on eventemitter2 with some nice added features
 */

import { EventEmitter2 } from 'eventemitter2'
import * as defaultsDeep from 'lodash/defaultsDeep'

const DEFAULT_OPTS = {
  delimiter: ':',
  maxListeners: 10,
  newListener: false,
  verboseMemoryLeak: true,
  wildcard: true
}

export class EventEmitter extends EventEmitter2 {
  /**
   * Creates a new event emitter
   *
   * @param {Object} [opts]
   */
  public constructor (opts = {}) {
    super(defaultsDeep({}, DEFAULT_OPTS, opts))
  }

  /**
   * This emites an async event, that will resolve the results by running
   * listeners step by step. This is great for things that can be extended and
   * modified by listeners.
   *
   * @param {string} event
   * @param {*} arg
   * @return {*} - Results of arg after modification from listeners
   */
  public async emitAsyncChain<T> (event, arg): Promise<T> {
    const listeners = this.listeners(event)
    let value = arg

    for (const listener of listeners) {
      await Promise.resolve(listener(value))
        .then((result) => (value = result))
    }

    return value
  }
}
