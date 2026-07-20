import {
  describe,
  it,
  expect
} from 'vitest'
import {
  defaultPostfix,
  mergeProcessingOptions
} from './defaults.ts'

describe('core', () => {
  describe('defaults', () => {
    describe('defaultPostfix', () => {
      it('should return empty postfix for original-size multiplier', () => {
        expect(defaultPostfix(640, 1, 'jpg')).toBe('')
      })

      it('should return width postfix for other widths', () => {
        expect(defaultPostfix(320, 320, 'jpg')).toBe('@320w')
        expect(defaultPostfix(320, 0.5, 'webp')).toBe('@320w')
      })
    })

    describe('mergeProcessingOptions', () => {
      it('should merge options per format', () => {
        expect(mergeProcessingOptions(
          {
            jpg: {
              mozjpeg: true
            }
          },
          {
            jpg: {
              quality: 80
            }
          }
        )).toEqual({
          jpg: {
            mozjpeg: true,
            quality: 80
          }
        })
      })

      it('should give precedence to later options', () => {
        expect(mergeProcessingOptions(
          {
            jpg: {
              quality: 75
            }
          },
          {
            jpg: {
              quality: 90
            }
          }
        )).toEqual({
          jpg: {
            quality: 90
          }
        })
      })

      it('should keep formats not present in later options', () => {
        expect(mergeProcessingOptions(
          {
            png: {
              palette: true
            }
          },
          {
            jpg: {
              quality: 80
            }
          }
        )).toEqual({
          png: {
            palette: true
          },
          jpg: {
            quality: 80
          }
        })
      })

      it('should return copy of base options without override', () => {
        const base = {
          jpg: {
            quality: 80
          }
        }
        const merged = mergeProcessingOptions(base, undefined)

        expect(merged).toEqual(base)
        expect(merged).not.toBe(base)
      })
    })
  })
})
