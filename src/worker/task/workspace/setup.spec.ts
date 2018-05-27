/**
 * houston/src/worker/task/workspace/setup.spec.ts
 * Tests building out workspaces
 */

import { WorkspaceSetup } from './setup'

import { mock } from '../../../../test/utility/worker'

test('builds workspace from all matching branches', async () => {
  const worker = await mock({
    distribution: 'loki',
    nameDomain: 'com.github.elementary.houston',
    package: { type: 'deb' },
    references: ['refs/heads/loki']
  })

  worker.repository.references = async () => ([
    'refs/heads/deb-packaging-loki',
    'refs/heads/deb-packaging-juno',
    'refs/heads/deb-packaging',
    'refs/heads/juno',
    'refs/heads/loki',
    'refs/heads/master'
  ])

  const setup = new WorkspaceSetup(worker)
  const setups = await setup.possibleBuilds()

  expect(setups.length).toBe(2)

  expect(setups).toContainEqual({
    architecture: 'amd64',
    distribution: 'loki',
    packageType: 'deb'
  })

  expect(setups).toContainEqual({
    architecture: 'amd64',
    distribution: 'juno',
    packageType: 'deb'
  })
}, 300000)
