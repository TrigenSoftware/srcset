import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import {
  SrcSetCacheStorage,
  getImageMetadata
} from '@srcset/core'
import { createPlaceholder } from './placeholder.ts'

async function createImage(width = 640, height = 480) {
  const contents = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#3a7bd5'
    }
  }).jpeg().toBuffer()

  return {
    path: '/images/image.jpg',
    contents
  }
}

async function createFixture(width = 640, height = 480) {
  const image = await createImage(width, height)

  return {
    image,
    metadata: await getImageMetadata(image)
  }
}

describe('bundler-utils', () => {
  describe('placeholder', () => {
    describe('createPlaceholder', () => {
      it('should create webp data-url of default width', async () => {
        const {
          image,
          metadata
        } = await createFixture()
        const placeholder = await createPlaceholder(image, metadata, true)

        expect(placeholder).toMatch(/^data:image\/webp;base64,/)

        const decoded = Buffer.from((placeholder as string).split(',')[1], 'base64')
        const decodedMetadata = await sharp(decoded).metadata()

        expect(decodedMetadata.format).toBe('webp')
        expect(decodedMetadata.width).toBe(16)
      })

      it('should respect width and format options', async () => {
        const {
          image,
          metadata
        } = await createFixture()
        const placeholder = await createPlaceholder(image, metadata, {
          width: 8,
          format: 'jpg'
        })

        expect(placeholder).toMatch(/^data:image\/jpeg;base64,/)

        const decoded = Buffer.from((placeholder as string).split(',')[1], 'base64')
        const decodedMetadata = await sharp(decoded).metadata()

        expect(decodedMetadata.format).toBe('jpeg')
        expect(decodedMetadata.width).toBe(8)
      })

      it('should not enlarge images smaller than the placeholder', async () => {
        const {
          image,
          metadata
        } = await createFixture(8, 6)
        const placeholder = await createPlaceholder(image, metadata, true)
        const decoded = Buffer.from((placeholder as string).split(',')[1], 'base64')
        const decodedMetadata = await sharp(decoded).metadata()

        expect(decodedMetadata.width).toBe(8)
      })

      it('should return undefined when disabled', async () => {
        const {
          image,
          metadata
        } = await createFixture()

        expect(await createPlaceholder(image, metadata, undefined)).toBeUndefined()
        expect(await createPlaceholder(image, metadata, false)).toBeUndefined()
      })

      it('should reuse the stored placeholder from the cache', async () => {
        const cache = new SrcSetCacheStorage(await mkdtemp(path.join(tmpdir(), 'srcset-placeholder-')))
        const {
          image,
          metadata
        } = await createFixture()
        const limit = vi.fn((task: () => Promise<Buffer>) => task())
        const placeholder = await createPlaceholder(image, metadata, true, limit, cache)

        expect(limit).toHaveBeenCalledTimes(1)

        const cached = await createPlaceholder(image, metadata, true, limit, cache)

        expect(limit).toHaveBeenCalledTimes(1)
        expect(cached).toBe(placeholder)

        await createPlaceholder(image, metadata, {
          width: 8
        }, limit, cache)

        expect(limit).toHaveBeenCalledTimes(2)
      })
    })
  })
})
