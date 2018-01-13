/**
 * houston/src/worker/server.ts
 * A server to listen for build requests
 *
 * @exports {Class} Server
 */

import { Repository } from '../lib/service/base/repository'
import { Storable } from './storable'

export class Server {

  public async start () {
    //
  }

  public async stop () {
    //
  }

  protected async branches (repository: Repository) {
    //
  }

  protected async handleBuildRequest (storable: Storable) {
    //
  }

}
