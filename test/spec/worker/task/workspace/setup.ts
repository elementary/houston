/**
 * houston/test/spec/worker/task/workspace/setup.ts
 * Tests building out workspaces
 */

import test from 'ava'

import { WorkspaceSetup } from '../../../../../src/worker/task/workspace/setup'

import { mock } from '../../../../utility/worker'

test('builds workspace from all matching branches', async (t) => {
  const worker = await mock({
    distribution: 'loki',
    nameDomain: 'com.github.elementary.houston',
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

  t.deepEqual(setups, [{
    architecture: 'amd64',
    distribution: 'loki',
    packageType: 'deb'
  }, {
    architecture: 'amd64',
    distribution: 'juno',
    packageType: 'deb'
  }])
})

test('deb-packaging adds the latest version even if builds exist', async (t) => {
  const worker = await mock({
    distribution: 'loki',
    nameDomain: 'com.github.elementary.houston',
    references: ['refs/heads/loki']
  })

  worker.repository.references = async () => ([
    'refs/heads/deb-packaging-loki',
    'refs/heads/deb-packaging',
    'refs/heads/master'
  ])

  const setup = new WorkspaceSetup(worker)
  const setups = await setup.possibleBuilds()

  t.deepEqual(setups, [{
    architecture: 'amd64',
    distribution: 'loki',
    packageType: 'deb'
  }, {
    architecture: 'amd64',
    distribution: 'juno',
    packageType: 'deb'
  }])
})

test('builds workspace defaults to latest version', async (t) => {
  const worker = await mock({
    distribution: 'loki',
    nameDomain: 'com.github.elementary.houston',
    references: ['refs/heads/loki']
  })

  worker.repository.references = async () => ([
    'refs/heads/deb-packaging',
    'refs/heads/master'
  ])

  const setup = new WorkspaceSetup(worker)
  const setups = await setup.possibleBuilds()

  t.deepEqual(setups, [{
    architecture: 'amd64',
    distribution: 'juno',
    packageType: 'deb'
  }])
})
