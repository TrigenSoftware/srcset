import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import { Cloudflare } from './image.ts'

const cloudflare = new Cloudflare()
const passthrough = new Cloudflare({
  passthrough: true
})
const sourceUrl = 'https://cdn.example.com/photo.jpg'

describe('cloudflare', () => {
  describe('image', () => {
    describe('Cloudflare', () => {
      it('should build loader-shaped image', () => {
        const image = cloudflare.image(sourceUrl, {
          width: 1200
        })

        expect(image.src).toEqual({
          id: 'jpg1200',
          format: 'jpg',
          type: 'image/jpeg',
          width: 1200,
          url: '/cdn-cgi/image/width=1200,format=jpeg/https://cdn.example.com/photo.jpg'
        })
        expect(image.url).toBe(image.src.url)
        expect(image.srcSet).toEqual([image.src])
        expect(image.srcMap).toEqual({
          jpg1200: image.src.url
        })
      })

      it('should default the format to the url extension', () => {
        const image = cloudflare.image('https://cdn.example.com/picture.png?v=2', {
          width: 600
        })

        expect(image.src.format).toBe('png')
        // Cloudflare can not force png, so the format option is omitted.
        expect(image.url).toBe('/cdn-cgi/image/width=600/https://cdn.example.com/picture.png?v=2')
      })

      it('should fall back to jpg without a known url extension', () => {
        const image = cloudflare.image('https://cdn.example.com/api/image/42', {
          width: 600
        })

        expect(image.src.format).toBe('jpg')
      })

      it('should pass an svg source through', () => {
        const image = cloudflare.image('https://cdn.example.com/logo.svg', {
          width: 600
        })

        expect(image.url).toBe('https://cdn.example.com/logo.svg')
        expect(image.src.format).toBe('svg')
        expect(image.src.type).toBe('image/svg+xml')
        expect(image.srcSet).toEqual([])
        expect(image.srcMap).toEqual({})
      })

      it('should pass an svg source through despite rule formats', () => {
        const image = cloudflare.image('https://cdn.example.com/logo.svg', {
          width: 600,
          format: 'webp'
        })

        expect(image.url).toBe('https://cdn.example.com/logo.svg')
        expect(image.src.format).toBe('svg')
      })

      it('should not infer the format from the query string', () => {
        const image = cloudflare.image('https://cdn.example.com/api/image?file=photo.png', {
          width: 600
        })

        expect(image.src.format).toBe('jpg')
      })

      it('should ignore prototype properties as formats', () => {
        const image = cloudflare.image('https://cdn.example.com/photo.constructor', {
          width: 600
        })

        expect(image.src.format).toBe('jpg')
      })

      it('should build variants for widths and formats', () => {
        const image = cloudflare.image(sourceUrl, {
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
          '/cdn-cgi/image/width=600,format=webp/https://cdn.example.com/photo.jpg'
        )
      })

      it('should throw on formats Cloudflare can not force', () => {
        expect(() => cloudflare.image(sourceUrl, {
          width: 600,
          format: 'png'
        })).toThrow('force')
      })

      it('should allow the source format in the rule', () => {
        const image = cloudflare.image('https://cdn.example.com/picture.png', {
          width: 600,
          format: ['webp', 'png']
        })

        expect(image.srcSet.map(({ id }) => id)).toEqual(['webp600', 'png600'])
        expect(image.srcMap.png600).toBe('/cdn-cgi/image/width=600/https://cdn.example.com/picture.png')
      })

      it('should deduplicate formats and widths', () => {
        expect(cloudflare.image(sourceUrl, {
          width: [600, 600],
          format: ['jpg', 'jpg']
        }).srcSet.length).toBe(1)
      })

      it('should select fallback src of the last format with the largest width', () => {
        const image = cloudflare.image(sourceUrl, {
          width: [300, 1200, 600],
          format: ['avif', 'webp', 'jpg']
        })

        expect(image.src.id).toBe('jpg1200')
      })

      it('should use custom endpoint', () => {
        const zone = new Cloudflare({
          endpoint: 'https://example.com/cdn-cgi/image'
        })
        const image = zone.image('/assets/photo.jpg', {
          width: 600
        })

        expect(image.url).toBe('https://example.com/cdn-cgi/image/width=600,format=jpeg/assets/photo.jpg')
      })

      it('should use custom processing builder', () => {
        const negotiated = new Cloudflare({
          processing: ({ width }) => `width=${width},format=auto`
        })
        const image = negotiated.image(sourceUrl, {
          width: 600,
          format: 'webp'
        })

        expect(image.url).toBe(
          '/cdn-cgi/image/width=600,format=auto/https://cdn.example.com/photo.jpg'
        )
      })

      it('should pass quality to default processing', () => {
        const withQuality = new Cloudflare({
          quality: 75
        })
        const image = withQuality.image(sourceUrl, {
          width: 1200
        })

        expect(image.url).toContain('/width=1200,format=jpeg,quality=75/')
      })

      it('should throw on multiplier widths', () => {
        expect(() => cloudflare.image(sourceUrl, {
          width: [0.5]
        })).toThrow('absolute')
      })

      it('should throw on non-integer widths', () => {
        expect(() => cloudflare.image(sourceUrl, {
          width: Number.NaN
        })).toThrow(TypeError)
        expect(() => cloudflare.image(sourceUrl, {
          width: Number.POSITIVE_INFINITY
        })).toThrow(TypeError)
        expect(() => cloudflare.image(sourceUrl, {
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

      it('should not call processing in passthrough mode', () => {
        const processing = vi.fn(() => 'width=600')
        const withHook = new Cloudflare({
          passthrough: true,
          processing
        })

        withHook.image(sourceUrl, {
          width: 600
        })

        expect(processing).not.toHaveBeenCalled()
      })

      it('should throw without variants', () => {
        expect(() => cloudflare.image(sourceUrl, {})).toThrow(TypeError)
        expect(() => cloudflare.image(sourceUrl, {
          width: 100,
          format: 'svg'
        })).toThrow(TypeError)
      })
    })
  })
})
