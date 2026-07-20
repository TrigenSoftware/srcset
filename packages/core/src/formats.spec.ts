import {
  describe,
  it,
  expect
} from 'vitest'
import {
  normalizeFormat,
  isSupportedFormat,
  getFormatFromPath,
  mimeTypes
} from './formats.ts'

describe('core', () => {
  describe('formats', () => {
    describe('normalizeFormat', () => {
      it('should lowercase format name', () => {
        expect(normalizeFormat('PNG')).toBe('png')
      })

      it('should resolve jpeg alias to jpg', () => {
        expect(normalizeFormat('jpeg')).toBe('jpg')
        expect(normalizeFormat('JPEG')).toBe('jpg')
      })

      it('should resolve heif alias to avif', () => {
        expect(normalizeFormat('heif')).toBe('avif')
      })
    })

    describe('isSupportedFormat', () => {
      it('should accept supported formats', () => {
        expect(isSupportedFormat('avif')).toBe(true)
        expect(isSupportedFormat('webp')).toBe(true)
        expect(isSupportedFormat('jpg')).toBe(true)
        expect(isSupportedFormat('png')).toBe(true)
        expect(isSupportedFormat('gif')).toBe(true)
        expect(isSupportedFormat('svg')).toBe(true)
      })

      it('should reject unsupported formats', () => {
        expect(isSupportedFormat('bmp')).toBe(false)
        expect(isSupportedFormat('')).toBe(false)
      })
    })

    describe('getFormatFromPath', () => {
      it('should extract normalized format from file path', () => {
        expect(getFormatFromPath('/images/photo.JPEG')).toBe('jpg')
        expect(getFormatFromPath('/images/icon.svg')).toBe('svg')
      })

      it('should return empty string for path without extension', () => {
        expect(getFormatFromPath('/images/photo')).toBe('')
      })
    })

    describe('mimeTypes', () => {
      it('should map formats to mime types', () => {
        expect(mimeTypes.jpg).toBe('image/jpeg')
        expect(mimeTypes.svg).toBe('image/svg+xml')
        expect(mimeTypes.avif).toBe('image/avif')
      })
    })
  })
})
