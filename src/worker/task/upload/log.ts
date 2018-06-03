/**
 * houston/src/worker/task/upload/log.ts
 * Uploads end error logs to third party services
 */

import * as path from 'path'

import { Logger } from '../../../lib/log'
import { isLogRepository } from '../../../lib/service'
import { Log } from '../../log'
import { ILog } from '../../type'
import { Task } from '../task'

export class UploadLog extends Task {
  /**
   * A list of collected errors we get from third party services.
   *
   * @var {Object[]}
   */
  protected errors: { error: Error, service: string }[] = []

  /**
   * Uploads all of the logs to third party services
   *
   * @async
   * @return {void}
   */
  public async run () {
    let logs = this.worker.result.logs
    const ref = this.worker.context.references[this.worker.context.references.length - 1]

    logs = await this.uploadToCodeRepository(logs, ref)

    this.worker.context.logs = logs

    if (this.errors.length !== 0) {
      this.reportErrors()
    }
  }

  /**
   * Uploads logs to the origin code repository if it's also a log repo
   *
   * @async
   * @param {ILog[]} logs
   * @param {string} ref
   * @return {ILog[]}
   */
  protected async uploadToCodeRepository (logs, ref): Promise<ILog[]> {
    if (!isLogRepository(this.worker.repository)) {
      return
    }

    const newLogs: ILog[] = []

    try {
      for (const log of logs) {
        newLogs.push(await this.worker.repository.uploadLog(log, 'review', ref))
      }
    } catch (error) {
      this.errors.push({ error, service: this.worker.repository.serviceName })
    }

    return newLogs
  }

  /**
   * Concats all the errors we have and puts them to a nice markdown log.
   *
   * @throws {Log}
   */
  protected reportErrors () {
    const logger = this.worker.app.get<Logger>(Logger)
    this.errors.map((e) => logger.error('Error uploading logs').setError(e.error))

    if (this.errors.length !== 0) {
      const logPath = path.resolve(__dirname, 'log.md')
      throw Log.template(Log.Level.ERROR, logPath, {
        services: this.errors.map((e) => e.service)
      })
    }
  }
}
