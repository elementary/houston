/**
 * houston/src/client/client.ts
 * A http server for server side rendering of our vue app.
 */

import { inject, injectable, multiInject } from 'inversify'

import { Controller, Server } from '../lib/server'

/**
 * Server
 * A server for server side rendering.
 */
@injectable()
export class Client extends Server {
  /**
   * A list of controllers this server has
   *
   * @var {Controller}
   */
  protected controllers: Controller[] = [

  ]
}
