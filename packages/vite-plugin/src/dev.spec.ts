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
import type { ReadStream } from 'node:fs'
import { Writable } from 'node:stream'
import {
  mkdtemp,
  rm
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  SrcSetCacheStorage,
  getStoredPath
} from '@srcset/core'
import { createDevMiddleware } from './dev.ts'

const key = 'a'.repeat(64)
// Larger than the stream watermark, so the response cannot drain in one tick.
const oversizedContents = 1024 * 1024

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

        await storage.write(getStoredPath(key, 'image.webp'), contents)

        const middleware = createDevMiddleware(storage)
        const request = {
          url: `/@srcset/${key}/image.webp`
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

        await storage.write(getStoredPath(key, 'image.webp'), Buffer.from('variant'))
        await rm(path.join(dir, getStoredPath(key, 'image.webp')))

        const middleware = createDevMiddleware(storage)
        const request = {
          url: `/@srcset/${key}/image.webp`
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

        await storage.write(getStoredPath(key, 'image.webp'), contents)

        const middleware = createDevMiddleware(storage, '/assets/')
        const request = {
          url: `/assets/@srcset/${key}/image.webp`
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

        await storage.write(getStoredPath(key, 'image.webp'), contents)

        const middleware = createDevMiddleware(storage)
        const request = {
          url: `/@srcset/${key}/image.webp?v=1`
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

      it('should destroy the stream when the request is aborted', async () => {
        const { storage } = await createStorage()
        const streams: ReadStream[] = []
        const readStream = storage.readStream.bind(storage)

        await storage.write(getStoredPath(key, 'image.webp'), Buffer.alloc(oversizedContents))

        vi.spyOn(storage, 'readStream').mockImplementation((path: string) => {
          const stream = readStream(path)

          streams.push(stream)

          return stream
        })

        const middleware = createDevMiddleware(storage)
        const { response } = createResponse()

        middleware({
          url: `/@srcset/${key}/image.webp`
        } as IncomingMessage, response, vi.fn())
        response.destroy()

        await new Promise<void>((resolve) => {
          streams[0].on('close', () => {
            resolve()
          })
        })

        expect(streams[0].destroyed).toBe(true)
      })

      it('should serve same-named variants of different sources apart', async () => {
        const { storage } = await createStorage()
        const otherKey = 'b'.repeat(64)

        await storage.write(getStoredPath(key, 'image.webp'), Buffer.from('first'))
        await storage.write(getStoredPath(otherKey, 'image.webp'), Buffer.from('second'))

        const middleware = createDevMiddleware(storage)
        const first = createResponse()
        const second = createResponse()

        middleware({
          url: `/@srcset/${key}/image.webp`
        } as IncomingMessage, first.response, vi.fn())
        middleware({
          url: `/@srcset/${otherKey}/image.webp`
        } as IncomingMessage, second.response, vi.fn())

        await Promise.all([first.finished, second.finished])

        expect(first.body()).toEqual(Buffer.from('first'))
        expect(second.body()).toEqual(Buffer.from('second'))
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
          url: `/@srcset/${key}/%`
        } as IncomingMessage, createResponse().response, next)
        middleware({
          url: `/@srcset/${key}/..%2Fsecret.jpg`
        } as IncomingMessage, createResponse().response, next)
        middleware({
          url: `/@srcset/${key}/manifest.json`
        } as IncomingMessage, createResponse().response, next)
        middleware({
          url: '/@srcset/image.webp'
        } as IncomingMessage, createResponse().response, next)

        expect(next).toHaveBeenCalledTimes(6)
      })
    })
  })
})
