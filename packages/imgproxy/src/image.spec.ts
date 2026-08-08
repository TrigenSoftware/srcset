import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import { Imgproxy } from './image.ts'

const imgproxy = new Imgproxy({
  endpoint: 'https://imgproxy.example.com'
})
const passthrough = new Imgproxy({
  endpoint: 'https://imgproxy.example.com',
  passthrough: true
})
const sourceUrl = 'https://cdn.example.com/photo.jpg'

describe('imgproxy', () => {
  describe('image', () => {
    describe('Imgproxy', () => {
      it('should build loader-shaped image', () => {
        const image = imgproxy.image(sourceUrl, {
          width: 1200
        })

        expect(image.src).toEqual({
          id: 'jpg1200',
          format: 'jpg',
          type: 'image/jpeg',
          width: 1200,
          url: 'https://imgproxy.example.com/insecure/w:1200/f:jpg/aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20vcGhvdG8uanBn'
        })
        expect(image.url).toBe(image.src.url)
        expect(image.srcSet).toEqual([image.src])
        expect(image.srcMap).toEqual({
          jpg1200: image.src.url
        })
      })

      it('should default the format to the url extension', () => {
        const image = imgproxy.image('https://cdn.example.com/picture.png?v=2', {
          width: 600
        })

        expect(image.src.format).toBe('png')
        expect(image.url).toContain('/w:600/f:png/')
      })

      it('should fall back to jpg without a known url extension', () => {
        const image = imgproxy.image('https://cdn.example.com/api/image/42', {
          width: 600
        })

        expect(image.src.format).toBe('jpg')
      })

      it('should default an svg source to jpg', () => {
        const image = imgproxy.image('https://cdn.example.com/logo.svg', {
          width: 600
        })

        expect(image.src.format).toBe('jpg')
      })

      it('should not infer the format from the query string', () => {
        const image = imgproxy.image('https://cdn.example.com/api/image?file=photo.png', {
          width: 600
        })

        expect(image.src.format).toBe('jpg')
      })

      it('should ignore prototype properties as formats', () => {
        const image = imgproxy.image('https://cdn.example.com/photo.constructor', {
          width: 600
        })

        expect(image.src.format).toBe('jpg')
      })

      it('should build variants for widths and formats', () => {
        const image = imgproxy.image(sourceUrl, {
          width: [1200, 600],
          format: ['webp', 'jpg']
        })

        expect(image.srcSet.map(({ id }) => id)).toEqual([
          'webp1200',
          'webp600',
          'jpg1200',
          'jpg600'
        ])
        expect(image.srcMap.webp600).toBe(
          'https://imgproxy.example.com/insecure/w:600/f:webp/aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20vcGhvdG8uanBn'
        )
      })

      it('should deduplicate formats and widths', () => {
        expect(imgproxy.image(sourceUrl, {
          width: [600, 600],
          format: ['jpg', 'jpg']
        }).srcSet.length).toBe(1)
      })

      it('should select fallback src of the last format with the largest width', () => {
        const image = imgproxy.image(sourceUrl, {
          width: [300, 1200, 600],
          format: ['avif', 'webp', 'jpg']
        })

        expect(image.src.id).toBe('jpg1200')
      })

      it('should use custom processing builder', () => {
        const presets = new Imgproxy({
          endpoint: 'https://imgproxy.example.com',
          processing: ({
            format,
            width
          }) => `pr:card_${format}_${width}`
        })
        const image = presets.image(sourceUrl, {
          width: 600,
          format: 'webp'
        })

        expect(image.url).toBe(
          'https://imgproxy.example.com/insecure/pr:card_webp_600/aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20vcGhvdG8uanBn'
        )
      })

      it('should pass quality to default processing', () => {
        const withQuality = new Imgproxy({
          endpoint: 'https://imgproxy.example.com',
          quality: 75
        })
        const image = withQuality.image(sourceUrl, {
          width: 1200
        })

        expect(image.url).toContain('/w:1200/f:jpg/q:75/')
      })

      it('should throw on multiplier widths', () => {
        expect(() => imgproxy.image(sourceUrl, {
          width: [0.5]
        })).toThrow('absolute')
      })

      it('should throw on non-integer widths', () => {
        expect(() => imgproxy.image(sourceUrl, {
          width: Number.NaN
        })).toThrow(TypeError)
        expect(() => imgproxy.image(sourceUrl, {
          width: Number.POSITIVE_INFINITY
        })).toThrow(TypeError)
        expect(() => imgproxy.image(sourceUrl, {
          width: 640.5
        })).toThrow(TypeError)
      })

      it('should pass the source url through in passthrough mode', () => {
        const image = passthrough.image(sourceUrl, {
          width: [600, 1200],
          format: ['webp', 'jpg']
        })

        expect(image.url).toBe(sourceUrl)
        expect(image.src).toEqual({
          id: 'jpg1200',
          format: 'jpg',
          type: 'image/jpeg',
          width: 1200,
          url: sourceUrl
        })
        expect(image.srcSet).toEqual([])
        expect(image.srcMap).toEqual({})
      })

      it('should validate the rule in passthrough mode', () => {
        expect(() => passthrough.image(sourceUrl, {
          width: [0.5]
        })).toThrow('absolute')
        expect(() => passthrough.image(sourceUrl, {})).toThrow(TypeError)
      })

      it('should keep the svg format of a passthrough source', () => {
        const image = passthrough.image('https://cdn.example.com/logo.svg', {
          width: 600
        })

        expect(image.src.format).toBe('svg')
        expect(image.src.type).toBe('image/svg+xml')
        expect(image.src.url).toBe('https://cdn.example.com/logo.svg')
      })

      it('should not call processing and signer in passthrough mode', () => {
        const processing = vi.fn(() => 'w:600/f:jpg')
        const signer = vi.fn(() => 'signature')
        const withHooks = new Imgproxy({
          endpoint: 'https://imgproxy.example.com',
          passthrough: true,
          signer,
          processing
        })

        withHooks.image(sourceUrl, {
          width: 600
        })

        expect(processing).not.toHaveBeenCalled()
        expect(signer).not.toHaveBeenCalled()
      })

      it('should throw without variants', () => {
        expect(() => imgproxy.image(sourceUrl, {})).toThrow(TypeError)
        expect(() => imgproxy.image(sourceUrl, {
          width: 100,
          format: 'svg'
        })).toThrow(TypeError)
      })
    })
  })
})
