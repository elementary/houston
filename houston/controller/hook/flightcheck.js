/**
 * houston/controller/hook/flightcheck.js
 * Handles all communcation from atc flightcheck connections
 */

import atc from '~/houston/service/atc'
import Cycle from '~/houston/model/cycle'

atc.on('cycle:finished', async (data) => {
  const cycle = await Cycle.findById(data.cycle)

  if (data.errors > 0) {
    cycle.update({ '_status': 'FAIL' })
  } else if (cycle.type === 'RELEASE') {
    cycle.build()
    .then(() => cycle.update({ '_status': 'BUILD' }))
  }

  // TODO: update project information
  const project = await cycle.getProject()
  for (const i in data.issues) {
    project.postIssue(data.issues[i])
  }
})
