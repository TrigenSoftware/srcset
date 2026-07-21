import {
  describe,
  it,
  expect
} from 'vitest'
import {
  groupBy,
  filterBy,
  toSrcSetString,
  toDensitySrcSetString
} from './utils.ts'
import {
  createSrc,
  createSrcSet
} from '../test/src.mock.ts'

describe('runtime', () => {
  describe('utils', () => {
    describe('groupBy', () => {
      it('should group variants by field preserving order', () => {
        const jpg320 = createSrc('jpg', 320)
        const webp320 = createSrc('webp', 320)
        const jpg640 = createSrc('jpg', 640)
        const entries = groupBy([jpg320, webp320, jpg640], 'format')

        expect(entries).toEqual([
          ['jpg', [jpg320, jpg640]],
          ['webp', [webp320]]
        ])
      })

      it('should return empty array for empty set', () => {
        expect(groupBy([], 'format')).toEqual([])
      })
    })

    describe('filterBy', () => {
      it('should filter variants by field value', () => {
        const jpg320 = createSrc('jpg', 320)
        const webp320 = createSrc('webp', 320)

        expect(filterBy([jpg320, webp320], 'format', 'webp')).toEqual([webp320])
      })

      it('should return empty array when nothing matches', () => {
        expect(filterBy([createSrc('jpg', 320)], 'format', 'avif')).toEqual([])
      })
    })

    describe('toDensitySrcSetString', () => {
      it('should join urls with density descriptors relative to smallest width', () => {
        expect(toDensitySrcSetString(createSrcSet('jpg', [320, 640]))).toBe(
          '/images/image@320w.jpg 1x, /images/image@640w.jpg 2x'
        )
      })

      it('should round density to two decimals', () => {
        expect(toDensitySrcSetString(createSrcSet('jpg', [300, 400]))).toBe(
          '/images/image@300w.jpg 1x, /images/image@400w.jpg 1.33x'
        )
      })

      it('should return single url without descriptor', () => {
        expect(toDensitySrcSetString(createSrcSet('jpg', [320]))).toBe('/images/image@320w.jpg')
      })

      it('should return empty string for empty set', () => {
        expect(toDensitySrcSetString([])).toBe('')
      })
    })

    describe('toSrcSetString', () => {
      it('should join urls with width descriptors', () => {
        expect(toSrcSetString(createSrcSet('jpg', [320, 640]))).toBe(
          '/images/image@320w.jpg 320w, /images/image@640w.jpg 640w'
        )
      })

      it('should return single url without descriptor', () => {
        expect(toSrcSetString(createSrcSet('jpg', [320]))).toBe('/images/image@320w.jpg')
      })

      it('should return empty string for empty set', () => {
        expect(toSrcSetString([])).toBe('')
      })
    })
  })
})
