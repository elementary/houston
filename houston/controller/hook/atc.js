/**
 * houston/controller/hook/atc.js
 * Handles all communcation from atc connections
 */

import atc from '~/houston/service/atc'
import Cycle from '~/houston/model/cycle'

atc.on('cycle:finished', async (data) => {
  const cycle = await Cycle.findById(data.cycle)

  let status = 'FINISH'
  if (data.errors > 0) status = 'FAIL'
  if (cycle.type === 'RELEASE' && status !== 'FAIL') {
    cycle.build()
    status = 'BUILD'
  }

  cycle.update({ '_status': status }).exec()

  // TODO: update project information
  const project = await cycle.getProject()
  for (const i in data.issues) {
    project.postIssue(data.issues[i])
  }
})
