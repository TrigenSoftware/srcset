import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import {
  mkdtemp,
  readdir,
  rm
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type {
  GenerateContext,
  SrcSetImage
} from './types.ts'
import { SrcSetCacheStorage } from './cache.ts'

function createContext(contents = 'source'): GenerateContext {
  return {
    source: {
      path: '/images/image.jpg',
      contents: Buffer.from(contents)
    },
    metadata: {
      format: 'jpg',
      width: 640,
      height: 480,
      animated: false
    },
    processing: {},
    optimization: {},
    postfix: '',
    skipOptimization: true,
    scalingUp: true
  }
}

function createImage(): SrcSetImage {
  return {
    path: '/images/image@320w.webp',
    contents: Buffer.from('variant'),
    format: 'webp',
    width: 320,
    height: 240,
    postfix: '@320w',
    originMultiplier: 0.5
  }
}

async function createStorage() {
  const dir = await mkdtemp(path.join(tmpdir(), 'srcset-storage-'))

  return {
    dir,
    storage: new SrcSetCacheStorage(dir)
  }
}

describe('core', () => {
  describe('cache', () => {
    describe('SrcSetCacheStorage', () => {
      describe('memo', () => {
        it('should generate on miss and read back on hit', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }
          const image = createImage()
          const fn = vi.fn(() => Promise.resolve(image))
          const generated = await storage.memo(context, variant, fn)

          expect(fn).toHaveBeenCalledTimes(1)
          expect(generated).toEqual(image)

          const cached = await new SrcSetCacheStorage(dir).memo(context, variant, fn)

          expect(fn).toHaveBeenCalledTimes(1)
          expect(cached).toEqual(image)
        })

        it('should miss on different variant or source', async () => {
          const { storage } = await createStorage()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }
          const fn = vi.fn(() => Promise.resolve(createImage()))

          await storage.memo(createContext(), variant, fn)
          await storage.memo(createContext(), {
            ...variant,
            width: 0.25
          }, fn)
          await storage.memo(createContext('other'), variant, fn)

          expect(fn).toHaveBeenCalledTimes(3)
        })

        it('should miss on the same contents under a different source path', async () => {
          const { storage } = await createStorage()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }
          const fn = vi.fn(() => Promise.resolve(createImage()))
          const moved = createContext()

          moved.source.path = '/other/image.jpg'

          await storage.memo(createContext(), variant, fn)
          await storage.memo(moved, variant, fn)

          expect(fn).toHaveBeenCalledTimes(2)
        })

        it('should miss when the stored file is overwritten by a colliding name', async () => {
          const { storage } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }
          const fn = vi.fn(() => Promise.resolve(createImage()))

          await storage.memo(context, variant, fn)
          await storage.write(storage.getKey(context, variant).path, Buffer.from('other'))
          await storage.memo(context, variant, fn)

          expect(fn).toHaveBeenCalledTimes(2)
        })

        it('should not store skipped variants', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 2000
          }
          const fn = vi.fn(() => Promise.resolve(null))

          expect(await storage.memo(context, variant, fn)).toBeNull()
          expect(await storage.memo(context, variant, fn)).toBeNull()
          expect(fn).toHaveBeenCalledTimes(2)
          expect(await readdir(dir)).toHaveLength(0)
        })

        it('should regenerate when stored files are cleaned away', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }
          const fn = vi.fn(() => Promise.resolve(createImage()))

          await storage.memo(context, variant, fn)

          const files = (await readdir(dir)).filter(name => !name.endsWith('.json'))

          await Promise.all(files.map(name => rm(path.join(dir, name))))

          const regenerated = await storage.memo(context, variant, fn)

          expect(fn).toHaveBeenCalledTimes(2)
          expect(regenerated).toEqual(createImage())
        })
      })

      describe('getKey', () => {
        it('should derive both address parts from the inputs', async () => {
          const { storage } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }
          const address = storage.getKey(context, variant)

          expect(address.key).toMatch(/^[0-9a-f]{64}$/)
          expect(address.path).toBe('image.webp')
          expect(storage.getKey(context, variant)).toEqual(address)
        })

        it('should use the source file name for the svg passthrough', async () => {
          const { storage } = await createStorage()

          expect(storage.getKey(createContext(), null).path).toBe('image.jpg')
        })
      })

      describe('write', () => {
        it('should overwrite an existing file', async () => {
          const { storage } = await createStorage()
          const path = await storage.write('image.webp', Buffer.from('variant'))
          const updated = Buffer.from('other')

          await storage.write(path, updated)

          expect(await storage.read(path)).toEqual(updated)
        })
      })

      describe('paths', () => {
        it('should reject paths outside the storage directory', async () => {
          const { storage } = await createStorage()

          await expect(storage.write('../outside.webp', Buffer.from('x'))).rejects.toThrow('Invalid stored file path')
          await expect(storage.write('..', Buffer.from('x'))).rejects.toThrow('Invalid stored file path')
          await expect(storage.read('../outside.webp')).rejects.toThrow('Invalid stored file path')
          expect(() => storage.readStream('sub/dir.webp')).toThrow('Invalid stored file path')
        })

        it('should accept flat names with inner dots', async () => {
          const { storage } = await createStorage()
          const contents = Buffer.from('dots')

          await storage.write('image..webp', contents)

          expect(await storage.read('image..webp')).toEqual(contents)
        })
      })

      describe('read', () => {
        it('should read stored contents back', async () => {
          const { storage } = await createStorage()
          const image = createImage()
          const path = await storage.write('image.webp', image.contents)

          expect(await storage.read(path)).toEqual(image.contents)
        })
      })

      describe('readStream', () => {
        it('should stream stored contents', async () => {
          const { storage } = await createStorage()
          const image = createImage()
          const path = await storage.write('image.webp', image.contents)
          const chunks: Buffer[] = []

          for await (const chunk of storage.readStream(path)) {
            chunks.push(chunk as Buffer)
          }

          expect(Buffer.concat(chunks)).toEqual(image.contents)
        })
      })
    })
  })
})
