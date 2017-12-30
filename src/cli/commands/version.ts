/**
 * houston/src/cli/commands/seed.ts
 * Runs database seed scripts
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Database } from '../../lib/database/database'
import { setup } from '../utilities'

export const command = 'version'
export const describe = 'Displays Houston version information'

export async function handler (argv) {
  const { config } = setup(argv)

  console.log(`Release: ${config.get('houston.version')}`)
  if (config.has('houston.commit')) {
    console.log(`Commit: ${config.get('houston.commit')}`)
  } else {
    console.log('Commit: Unknown')
  }

  process.exit(0)
}
