/**
 * houston/src/cli/commands/client.ts
 * Runs the Client server
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Client as Server } from '../../client/client'
import { setup } from '../utilities'

export const command = 'client'
export const describe = 'Starts the client web server'

export const builder = (yargs) => {
    return yargs
      .option('port', { alias: 'p', describe: 'The port to run the server on', type: 'number', default: 0 })
}

export async function handler (argv) {
  const { app } = setup(argv)
  const server = app.get<Server>(Server)

  await server.listen(argv.port)
}
