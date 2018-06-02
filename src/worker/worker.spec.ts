/**
 * houston/src/worker/worker.ts
 * The master class for repository processing.
 *
 * @exports {Class} Process - A processing class
 */

import { Log } from './log'

import { mock } from '../../test/utility/worker'

test('any error logs result in a failed build', async () => {
  const worker = await mock()

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log #1', 'body test'))

  expect(worker.result.failed).toBeTruthy()
})

test('can find all logs from forks', async () => {
  const worker = await mock()

  worker.forks.push(await mock())
  worker.forks.push(await mock())
  worker.forks[0].forks.push(await mock())

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log #1', 'body test'))
  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log #2', 'body test'))
  worker.forks[0].context.logs.push(new Log(Log.Level.ERROR, 'testing log #3', 'body test'))
  worker.forks[1].context.logs.push(new Log(Log.Level.ERROR, 'testing log #4', 'body test'))
  worker.forks[0].forks[0].context.logs.push(new Log(Log.Level.ERROR, 'testing log #5', 'body test'))

  expect(worker.result.logs).toHaveLength(5)
})

test('treats logs with same title as duplicates', async () => {
  const worker = await mock()

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log #1', 'body test'))
  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log #1', 'body test'))
  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log #2', 'body test'))

  expect(worker.result.logs).toHaveLength(2)
})

test('adds architecture information to log', async () => {
  const worker = await mock({ architecture: 'amd64' })

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))

  expect(worker.result.logs).toHaveLength(1)
  expect(worker.result.logs[0].body).toMatch(/amd64/)
})

test('adds multiple architectures to log', async () => {
  const worker = await mock({ architecture: 'amd64' })

  worker.forks.push(await mock({ architecture: 'amd128' }))
  worker.forks.push(await mock({ architecture: 'iso386' }))

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))
  worker.forks[0].context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))
  worker.forks[1].context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))

  expect(worker.result.logs).toHaveLength(1)
  expect(worker.result.logs[0].body).toMatch(/amd64/)
  expect(worker.result.logs[0].body).toMatch(/amd128/)
  expect(worker.result.logs[0].body).toMatch(/iso386/)
})

test('adds distribution information to log', async () => {
  const worker = await mock({ distribution: 'loki' })

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))

  expect(worker.result.logs).toHaveLength(1)
  expect(worker.result.logs[0].body).toMatch(/loki/)
})

test('adds multiple distribution to log', async () => {
  const worker = await mock({ distribution: 'xenial' })

  worker.forks.push(await mock({ architecture: 'loki' }))
  worker.forks.push(await mock({ architecture: 'juno' }))

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))
  worker.forks[0].context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))
  worker.forks[1].context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))

  expect(worker.result.logs).toHaveLength(1)
  expect(worker.result.logs[0].body).toMatch(/xenial/)
  expect(worker.result.logs[0].body).toMatch(/loki/)
  expect(worker.result.logs[0].body).toMatch(/juno/)
})

test('adds built references information to log', async () => {
  const worker = await mock({
    references: ['refs/heads/master', 'refs/heads/v2', 'refs/heads/test']
  })

  worker.context.logs.push(new Log(Log.Level.ERROR, 'testing log', 'body test'))

  expect(worker.result.logs).toHaveLength(1)
  expect(worker.result.logs[0].body).toMatch(/refs\/heads\/master/)
  expect(worker.result.logs[0].body).toMatch(/refs\/heads\/v2/)
  expect(worker.result.logs[0].body).toMatch(/refs\/heads\/test/)
})
