import {
  describe,
  it,
  expect
} from 'vitest'
import { matchImage } from './match.ts'
import {
  createImage,
  fixtureWidth
} from '../test/image.mock.ts'

describe('core', () => {
  describe('match', () => {
    describe('matchImage', () => {
      it('should match any supported image without matchers', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image)).toBe(true)
        expect(await matchImage(image, null)).toBe(true)
        expect(await matchImage(image, undefined)).toBe(true)
      })

      it('should dismatch unsupported contents', async () => {
        expect(await matchImage({
          path: '/file.txt',
          contents: Buffer.from('not an image')
        })).toBe(false)
      })

      it('should match by media query', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, `(width: ${fixtureWidth}px)`)).toBe(true)
      })

      it('should dismatch by media query', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, '(max-width: 10px)')).toBe(false)
      })

      it('should match by path glob', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, '**/*.jpg')).toBe(true)
      })

      it('should dismatch by path glob', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, '**/*.png')).toBe(false)
      })

      it('should match by function', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, () => true)).toBe(true)
      })

      it('should dismatch by function', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, () => false)).toBe(false)
      })

      it('should pass path and size to matcher function', async () => {
        const image = await createImage('jpg')
        const matcher = (path: string, size: { width: number }) => path === image.path && size.width === fixtureWidth

        expect(await matchImage(image, matcher)).toBe(true)
      })

      it('should match by few matchers', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, ['**/*.jpg', `(width: ${fixtureWidth}px)`])).toBe(true)
      })

      it('should dismatch by few matchers', async () => {
        const image = await createImage('jpg')

        expect(await matchImage(image, ['**/*.png', `(width: ${fixtureWidth}px)`])).toBe(false)
      })
    })
  })
})
