/**
 * houston/src/cli/commands/api.ts
 * Runs the API server
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Api as Server } from '../../api/api'
import { setup } from '../utilities'

export const command = 'api'
export const describe = 'Starts the API web server'

export const builder = (yargs) => {
    return yargs
      .option('port', { alias: 'p', describe: 'The port to run the server on', type: 'number', default: 0 })
}

export async function handler (argv) {
  const { app } = setup(argv)
  const server = app.get<Server>(Server)

  await server.listen(argv.port)
}
