import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import type {
  IncomingMessage,
  ServerResponse
} from 'node:http'
import { Writable } from 'node:stream'
import {
  mkdtemp,
  rm
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SrcSetCacheStorage } from '@srcset/core'
import { createDevMiddleware } from './dev.ts'

async function createStorage() {
  const dir = await mkdtemp(path.join(tmpdir(), 'srcset-dev-'))

  return {
    dir,
    storage: new SrcSetCacheStorage(dir)
  }
}

function createResponse() {
  const chunks: Buffer[] = []
  const headers: Record<string, string> = {}
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk)
      callback()
    }
  })
  const response = Object.assign(stream, {
    headers,
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      headers[name] = value
    }
  })

  return {
    response: response as unknown as ServerResponse,
    headers,
    body: () => Buffer.concat(chunks),
    finished: new Promise<void>((resolvePromise) => {
      stream.on('finish', resolvePromise)
    }),
    statusCode: () => response.statusCode
  }
}

describe('vite-plugin', () => {
  describe('dev', () => {
    describe('createDevMiddleware', () => {
      it('should stream stored variants', async () => {
        const { storage } = await createStorage()
        const contents = Buffer.from('variant')

        await storage.write('image.webp', contents)

        const middleware = createDevMiddleware(storage)
        const request = {
          url: '/@srcset/image.webp'
        } as IncomingMessage
        const {
          response,
          headers,
          body,
          finished
        } = createResponse()
        const next = vi.fn()

        middleware(request, response, next)
        await finished

        expect(next).not.toHaveBeenCalled()
        expect(headers['Content-Type']).toBe('image/webp')
        expect(body()).toEqual(contents)
      })

      it('should respond with 404 when the file is cleaned away', async () => {
        const {
          dir,
          storage
        } = await createStorage()

        await storage.write('image.webp', Buffer.from('variant'))
        await rm(path.join(dir, 'image.webp'))

        const middleware = createDevMiddleware(storage)
        const request = {
          url: '/@srcset/image.webp'
        } as IncomingMessage
        const {
          response,
          finished,
          statusCode
        } = createResponse()
        const next = vi.fn()

        middleware(request, response, next)
        await finished

        expect(next).not.toHaveBeenCalled()
        expect(statusCode()).toBe(404)
      })

      it('should serve variants under a non-root base', async () => {
        const { storage } = await createStorage()
        const contents = Buffer.from('variant')

        await storage.write('image.webp', contents)

        const middleware = createDevMiddleware(storage, '/assets/')
        const request = {
          url: '/assets/@srcset/image.webp'
        } as IncomingMessage
        const {
          response,
          body,
          finished
        } = createResponse()
        const next = vi.fn()

        middleware(request, response, next)
        await finished

        expect(next).not.toHaveBeenCalled()
        expect(body()).toEqual(contents)
      })

      it('should serve variants with a query string', async () => {
        const { storage } = await createStorage()
        const contents = Buffer.from('variant')

        await storage.write('image.webp', contents)

        const middleware = createDevMiddleware(storage)
        const request = {
          url: '/@srcset/image.webp?v=1'
        } as IncomingMessage
        const {
          response,
          body,
          finished
        } = createResponse()
        const next = vi.fn()

        middleware(request, response, next)
        await finished

        expect(next).not.toHaveBeenCalled()
        expect(body()).toEqual(contents)
      })

      it('should pass foreign and unsafe urls to the next handler', async () => {
        const { storage } = await createStorage()
        const middleware = createDevMiddleware(storage)
        const next = vi.fn()

        middleware({
          url: '/assets/logo.svg'
        } as IncomingMessage, createResponse().response, next)
        middleware({
          url: '/api?next=/@srcset/image.webp'
        } as IncomingMessage, createResponse().response, next)
        middleware({
          url: '/@srcset/%'
        } as IncomingMessage, createResponse().response, next)
        middleware({
          url: '/@srcset/..%2Fsecret.jpg'
        } as IncomingMessage, createResponse().response, next)
        middleware({
          url: '/@srcset/manifest.json'
        } as IncomingMessage, createResponse().response, next)

        expect(next).toHaveBeenCalledTimes(5)
      })
    })
  })
})
