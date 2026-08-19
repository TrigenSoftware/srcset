import {
  describe,
  it,
  expect
} from 'vitest'
import { getImageMetadata } from './metadata.ts'
import {
  createImage,
  createAnimatedImage,
  createOrientedImage,
  createSvg,
  fixtureWidth,
  fixtureHeight
} from '../test/image.mock.ts'

describe('core', () => {
  describe('metadata', () => {
    describe('getImageMetadata', () => {
      it('should read size and format of raster image', async () => {
        const image = await createImage('jpg')
        const metadata = await getImageMetadata(image)

        expect(metadata.format).toBe('jpg')
        expect(metadata.width).toBe(fixtureWidth)
        expect(metadata.height).toBe(fixtureHeight)
        expect(metadata.animated).toBe(false)
      })

      it('should normalize avif format', async () => {
        const image = await createImage('avif', 64, 64)
        const metadata = await getImageMetadata(image)

        expect(metadata.format).toBe('avif')
      })

      it('should read size of svg image', async () => {
        const icon = createSvg(60, 60)
        const metadata = await getImageMetadata(icon)

        expect(metadata.format).toBe('svg')
        expect(metadata.width).toBe(60)
        expect(metadata.height).toBe(60)
      })

      it('should count pages of animated image', async () => {
        const animation = await createAnimatedImage(64, 64, 3)
        const metadata = await getImageMetadata(animation)

        expect(metadata.format).toBe('gif')
        expect(metadata.width).toBe(64)
        expect(metadata.height).toBe(64)
        expect(metadata.animated).toBe(true)
      })

      it('should report the size a browser renders for an oriented image', async () => {
        const image = await createOrientedImage()
        const metadata = await getImageMetadata(image)

        expect(metadata.width).toBe(fixtureHeight)
        expect(metadata.height).toBe(fixtureWidth)
      })

      it('should throw error on unsupported contents', async () => {
        await expect(getImageMetadata({
          path: '/file.txt',
          contents: Buffer.from('not an image')
        })).rejects.toThrow()
      })

      it('should cache metadata by contents buffer', async () => {
        const image = await createImage('jpg', 64, 64)
        const first = await getImageMetadata(image)
        const second = await getImageMetadata(image)

        expect(second).toBe(first)
      })
    })
  })
})
