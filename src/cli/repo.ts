/**
 * houston/src/cli/repo.ts
 * Runs the repository syslogd server
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Repo as Server } from '../repo/repo'
import * as cli from './cli'

export const command = 'repo'
export const describe = 'Starts the repository syslogd server'

export const builder = (yargs) => {
    return yargs
      .option('port', { alias: 'p', describe: 'The port to run the server on', type: 'number', default: 0 })
}

export async function handler (argv) {
  const config = cli.getConfig(argv)
  const server = new Server(config)
  cli.setupLog(config)

  await server.listen(argv.port)
}
