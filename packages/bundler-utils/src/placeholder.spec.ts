import {
  describe,
  it,
  expect
} from 'vitest'
import sharp from 'sharp'
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

describe('bundler-utils', () => {
  describe('placeholder', () => {
    describe('createPlaceholder', () => {
      it('should create webp data-url of default width', async () => {
        const image = await createImage()
        const placeholder = await createPlaceholder(image, true)

        expect(placeholder).toMatch(/^data:image\/webp;base64,/)

        const decoded = Buffer.from((placeholder as string).split(',')[1], 'base64')
        const metadata = await sharp(decoded).metadata()

        expect(metadata.format).toBe('webp')
        expect(metadata.width).toBe(16)
      })

      it('should respect width and format options', async () => {
        const image = await createImage()
        const placeholder = await createPlaceholder(image, {
          width: 8,
          format: 'jpg'
        })

        expect(placeholder).toMatch(/^data:image\/jpeg;base64,/)

        const decoded = Buffer.from((placeholder as string).split(',')[1], 'base64')
        const metadata = await sharp(decoded).metadata()

        expect(metadata.format).toBe('jpeg')
        expect(metadata.width).toBe(8)
      })

      it('should not enlarge images smaller than the placeholder', async () => {
        const image = await createImage(8, 6)
        const placeholder = await createPlaceholder(image, true)
        const decoded = Buffer.from((placeholder as string).split(',')[1], 'base64')
        const metadata = await sharp(decoded).metadata()

        expect(metadata.width).toBe(8)
      })

      it('should return undefined when disabled', async () => {
        const image = await createImage()

        expect(await createPlaceholder(image, undefined)).toBeUndefined()
        expect(await createPlaceholder(image, false)).toBeUndefined()
      })
    })
  })
})
