import {
  describe,
  it,
  expect
} from 'vitest'
import {
  getSourceProps,
  getImageProps
} from './attributes.ts'
import {
  createSrc,
  createSrcSet
} from '../test/src.mock.ts'

describe('runtime', () => {
  describe('attributes', () => {
    describe('getSourceProps', () => {
      it('should group variants into sources ordered by format efficiency', () => {
        const srcSet = [
          ...createSrcSet('jpg', [320, 640]),
          ...createSrcSet('webp', [320, 640]),
          ...createSrcSet('avif', [320, 640])
        ]

        expect(getSourceProps(srcSet)).toEqual([
          {
            type: 'image/avif',
            srcSet: '/images/image@320w.avif 320w, /images/image@640w.avif 640w'
          },
          {
            type: 'image/webp',
            srcSet: '/images/image@320w.webp 320w, /images/image@640w.webp 640w'
          },
          {
            type: 'image/jpeg',
            srcSet: '/images/image@320w.jpg 320w, /images/image@640w.jpg 640w'
          }
        ])
      })

      it('should return empty array for empty set', () => {
        expect(getSourceProps([])).toEqual([])
      })
    })

    describe('getImageProps', () => {
      it('should make src with srcset of the same format', () => {
        const src = createSrc('jpg', 640)
        const srcSet = [
          ...createSrcSet('jpg', [320, 640]),
          ...createSrcSet('webp', [320, 640])
        ]

        expect(getImageProps(src, srcSet)).toEqual({
          src: '/images/image@640w.jpg',
          srcSet: '/images/image@320w.jpg 320w, /images/image@640w.jpg 640w'
        })
      })

      it('should omit srcset when it duplicates src url', () => {
        const src = createSrc('jpg', 640)

        expect(getImageProps(src, [src])).toEqual({
          src: '/images/image@640w.jpg'
        })
      })

      it('should omit srcset without variants of the same format', () => {
        const src = createSrc('jpg', 640)

        expect(getImageProps(src, createSrcSet('webp', [320]))).toEqual({
          src: '/images/image@640w.jpg'
        })
      })

      it('should pass srcset string through', () => {
        const src = createSrc('jpg', 640)

        expect(getImageProps(src, 'custom 1x')).toEqual({
          src: '/images/image@640w.jpg',
          srcSet: 'custom 1x'
        })
      })

      it('should make srcset without src', () => {
        expect(getImageProps(undefined, createSrcSet('jpg', [320, 640]))).toEqual({
          srcSet: '/images/image@320w.jpg 320w, /images/image@640w.jpg 640w'
        })
      })

      it('should return empty props without src and srcset', () => {
        expect(getImageProps(undefined, undefined)).toEqual({})
      })
    })
  })
})
