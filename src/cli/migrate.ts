/**
 * houston/src/cli/migrate.ts
 * Runs database migration scripts
 */

// Command line files are allowed to have console log statements
// tslint:disable no-console

import { Database } from '../lib/database/database'
import { getConfig } from './cli'

export const command = 'migrate'
export const describe = 'Changes database tables based on houston schemas'

export const builder = (yargs) => {
    return yargs
      .option('direction', { describe: 'The direction to migrate', type: 'string', default: 'up' })
}

export async function handler (argv) {
  const config = getConfig(argv)
  const database = new Database(config)

  if (argv.direction === 'up') {
    const version = config.get('houston.version', 'latest')
    console.log(`Updating database tables to ${version} version`)
  } else if (argv.direction === 'down') {
    console.log(`Downgrading database tables 1 version`)
  } else {
    console.error(`Incorrect non-option arguments: got ${argv.direction}, need at be up or down`)
    process.exit(1)
  }

  try {
    if (argv.direction === 'up') {
      await database.knex.migrate.latest()
    } else if (argv.direction === 'down') {
      await database.knex.migrate.rollback()
    }
  } catch (e) {
    console.error('Error updating database tables')
    console.error(e.message)
    process.exit(1)
  }

  console.log('Updated database tables')
  process.exit(0)
}
