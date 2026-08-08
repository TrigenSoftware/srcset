import {
  describe,
  it,
  expect
} from 'vitest'
import {
  canOutputFormat,
  createDefaultProcessing,
  buildCloudflareUrl
} from './url.ts'

describe('cloudflare', () => {
  describe('url', () => {
    describe('canOutputFormat', () => {
      it('should allow forceable formats and the source format', () => {
        expect(canOutputFormat('webp', 'jpg')).toBe(true)
        expect(canOutputFormat('avif', 'png')).toBe(true)
        expect(canOutputFormat('png', 'png')).toBe(true)
        expect(canOutputFormat('png', 'jpg')).toBe(false)
        expect(canOutputFormat('svg', 'jpg')).toBe(false)
      })
    })

    describe('createDefaultProcessing', () => {
      it('should build width and format options', () => {
        expect(createDefaultProcessing()({
          format: 'jpg',
          width: 800
        })).toBe('width=800,format=jpeg')
        expect(createDefaultProcessing()({
          format: 'webp',
          width: 320
        })).toBe('width=320,format=webp')
      })

      it('should skip formats Cloudflare can not force', () => {
        expect(createDefaultProcessing()({
          format: 'png',
          width: 800
        })).toBe('width=800')
      })

      it('should add quality option', () => {
        expect(createDefaultProcessing(75)({
          format: 'jpg',
          width: 800
        })).toBe('width=800,format=jpeg,quality=75')
      })
    })

    describe('buildCloudflareUrl', () => {
      it('should join path source without the leading slash', () => {
        expect(buildCloudflareUrl('/cdn-cgi/image', 'width=800,format=jpeg', '/assets/image.jpg')).toBe(
          '/cdn-cgi/image/width=800,format=jpeg/assets/image.jpg'
        )
      })

      it('should keep absolute source url as is', () => {
        expect(buildCloudflareUrl(
          'https://example.com/cdn-cgi/image',
          'width=800,format=jpeg',
          'https://cdn.example.com/photo.jpg'
        )).toBe(
          'https://example.com/cdn-cgi/image/width=800,format=jpeg/https://cdn.example.com/photo.jpg'
        )
      })

      it('should normalize endpoint trailing slash', () => {
        expect(buildCloudflareUrl('/cdn-cgi/image/', 'width=800', 'assets/image.jpg')).toBe(
          '/cdn-cgi/image/width=800/assets/image.jpg'
        )
      })
    })
  })
})
