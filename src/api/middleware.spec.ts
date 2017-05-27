/**
 * houston/src/api/middleware.spec.ts
 * Tests the middleware specific to the API endpoints
 */

import * as supertest from 'supertest'

import { Server } from '../lib/server/server'
import * as middleware from './middleware'

import { setup as setupConfig } from '../../test/utility/config'

let config = null

beforeEach(async () => {
  config = await setupConfig()
})

test('catches errors and returns nice json api body', async () => {
  class TestServerClass extends Server {
    public registerMiddleware () {
      this.koa.use(middleware.catchError(this))

      super.registerMiddleware()
    }

    public registerRoutes () {
      this.koa.use(() => {
        throw new Error('this is bad')
      })
    }
  }

  const server = new TestServerClass(config)

  const res = await supertest(server.http())
    .get('/')
    .expect(500)

  expect(res.body).toEqual(expect.objectContaining({
    errors: [{
      status: 500,
      title: 'An Internal Error Occured'
    }]
  }))
})

test('checkHeaders passes with correct headers', async () => {
  class TestServerClass extends Server {
    public registerMiddleware () {
      this.koa.use(middleware.checkHeaders(this))

      super.registerMiddleware()
    }

    public registerRoutes () {
      this.koa.use((ctx) => {
        ctx.status = 200
      })
    }
  }

  const server = new TestServerClass(config)

  return supertest(server.http())
    .get('/')
    .set('Content-Type', 'application/vnd.api+json')
    .set('Accept', 'application/vnd.api+json')
    .set('Content-Length', 0)
    .expect(200)
})

test('checkHeaders throws error on invalid request headers', async () => {
  class TestServerClass extends Server {
    public registerMiddleware () {
      this.koa.use(middleware.checkHeaders(this))

      super.registerMiddleware()
    }

    public registerRoutes () {
      this.koa.use((ctx) => {
        ctx.status = 200
      })
    }
  }

  const server = new TestServerClass(config)

  return supertest(server.http())
    .get('/')
    .set('Content-Type', 'image/png')
    .set('Accepts', 'application/vnd.api+json')
    .set('Content-Length', 0)
    .expect(415)
})

test('checkHeaders throws error on invalid accepts headers', async () => {
  class TestServerClass extends Server {
    public registerMiddleware () {
      this.koa.use(middleware.checkHeaders(this))

      super.registerMiddleware()
    }

    public registerRoutes () {
      this.koa.use((ctx) => {
        ctx.status = 200
      })
    }
  }

  const server = new TestServerClass(config)

  return supertest(server.http())
    .get('/')
    .set('Content-Type', 'application/vnd.api+json')
    .set('Accept', 'text/javascript')
    .set('Content-Length', 0)
    .expect(406)
})

test('wrapBody wraps the body', async () => {
  class TestServerClass extends Server {
    public registerMiddleware () {
      this.koa.use(middleware.wrapBody(this))

      super.registerMiddleware()
    }

    public registerRoutes () {
      this.koa.use((ctx) => {
        ctx.status = 200
      })
    }
  }

  const server = new TestServerClass(config)

  const res = await supertest(server.http())
    .get('/')
    .expect(200)

  expect(res.body).toEqual(expect.objectContaining({
    meta: expect.objectContaining({
      date: expect.anything(),
      environment: config.get('houston.environment', 'development')
    }),
    links: expect.objectContaining({}),
    jsonapi: expect.objectContaining({
      version: '1.0'
    })
  }))
})
