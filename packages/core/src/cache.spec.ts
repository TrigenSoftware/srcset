import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  utimes,
  writeFile
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

const dayMs = 24 * 60 * 60 * 1000

async function getUsedAt(dir: string, key: string) {
  const manifest = await readFile(path.join(dir, `${key}.json`), 'utf8')

  return (JSON.parse(manifest) as { usedAt: number }).usedAt
}

async function setUsedAt(dir: string, key: string, usedAt: number) {
  const manifestPath = path.join(dir, `${key}.json`)
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>

  await writeFile(manifestPath, JSON.stringify({
    ...manifest,
    usedAt
  }))
}

async function createStorage() {
  const dir = await mkdtemp(path.join(tmpdir(), 'srcset-storage-'))

  return {
    dir,
    storage: new SrcSetCacheStorage({
      dir
    })
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
          const { key } = storage.getKey(context, variant)

          expect(fn).toHaveBeenCalledTimes(1)
          expect(generated).toEqual({
            ...image,
            cacheKey: key
          })

          const cached = await new SrcSetCacheStorage({
            dir
          }).memo(context, variant, fn)

          expect(fn).toHaveBeenCalledTimes(1)
          expect(cached).toEqual({
            ...image,
            cacheKey: key
          })
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

        it('should miss when the stored file is damaged', async () => {
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
          expect(regenerated).toEqual({
            ...createImage(),
            cacheKey: storage.getKey(context, variant).key
          })
        })
      })

      describe('prune', () => {
        it('should remove entries unused longer than the max age', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }

          await storage.memo(context, variant, () => Promise.resolve(createImage()))

          const { key } = storage.getKey(context, variant)

          await setUsedAt(dir, key, Date.now() - 31 * dayMs)
          await new SrcSetCacheStorage({
            dir
          }).prune()

          expect(await readdir(dir)).toEqual([])
        })

        it('should keep entries used within the max age', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }

          await storage.memo(context, variant, () => Promise.resolve(createImage()))
          await new SrcSetCacheStorage({
            dir
          }).prune()

          expect((await readdir(dir)).length).toBe(2)
        })

        it('should respect a custom max age', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }

          await storage.memo(context, variant, () => Promise.resolve(createImage()))

          const { key } = storage.getKey(context, variant)

          await setUsedAt(dir, key, Date.now() - 2 * dayMs)
          await new SrcSetCacheStorage({
            dir,
            maxAge: dayMs
          }).prune()

          expect(await readdir(dir)).toEqual([])
        })

        it('should keep a file left without its manifest within the grace period', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const path = `${'a'.repeat(64)}-image.webp`

          await storage.write(path, Buffer.from('half-written'))
          await new SrcSetCacheStorage({
            dir
          }).prune()

          expect(await readdir(dir)).toEqual([path])
        })

        it('should remove a file left without its manifest after the grace period', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const name = `${'a'.repeat(64)}-image.webp`
          const stale = new Date(Date.now() - 10 * 60 * 1000)

          await storage.write(name, Buffer.from('crash leftover'))
          await utimes(path.join(dir, name), stale, stale)
          await new SrcSetCacheStorage({
            dir
          }).prune()

          expect(await readdir(dir)).toEqual([])
        })

        it('should remove an entry with a manifest of an older version', async () => {
          const {
            dir,
            storage
          } = await createStorage()
          const context = createContext()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }

          await storage.memo(context, variant, () => Promise.resolve(createImage()))

          const { key } = storage.getKey(context, variant)
          const manifestPath = path.join(dir, `${key}.json`)
          const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>

          delete manifest.usedAt

          await writeFile(manifestPath, JSON.stringify(manifest))
          await new SrcSetCacheStorage({
            dir
          }).prune()

          expect(await readdir(dir)).toEqual([])
        })

        it('should keep files of other tools in the directory', async () => {
          const { dir } = await createStorage()

          await writeFile(path.join(dir, 'notes.txt'), 'not ours')
          await writeFile(path.join(dir, '.other-tool-cache'), 'not ours either')
          await new SrcSetCacheStorage({
            dir
          }).prune()

          expect((await readdir(dir)).sort()).toEqual(['.other-tool-cache', 'notes.txt'])
        })

        it('should refresh the used-at mark of a hit entry', async () => {
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

          const { key } = storage.getKey(context, variant)
          const staleUsedAt = Date.now() - 20 * dayMs

          await setUsedAt(dir, key, staleUsedAt)
          await new SrcSetCacheStorage({
            dir
          }).memo(context, variant, fn)

          expect(fn).toHaveBeenCalledTimes(1)
          expect(await getUsedAt(dir, key)).toBeGreaterThan(staleUsedAt)
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
          expect(address.path).toBe(`${address.key}-image.webp`)
          expect(storage.getKey(context, variant)).toEqual(address)
        })

        it('should use the source file name for the svg passthrough', async () => {
          const { storage } = await createStorage()
          const address = storage.getKey(createContext(), null)

          expect(address.path).toBe(`${address.key}-image.jpg`)
        })

        it('should give colliding variant names distinct stored paths', async () => {
          const { storage } = await createStorage()
          const variant = {
            format: 'webp' as const,
            width: 0.5
          }
          const moved = createContext()

          moved.source.path = '/other/image.jpg'

          const address = storage.getKey(createContext(), variant)
          const movedAddress = storage.getKey(moved, variant)

          expect(address.path).not.toBe(movedAddress.path)
          expect(address.path.endsWith('-image.webp')).toBe(true)
          expect(movedAddress.path.endsWith('-image.webp')).toBe(true)
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
