import {
  describe,
  it,
  expect
} from 'vitest'
import {
  type DevCache,
  addDevImage
} from './dev.ts'

describe('vite-plugin', () => {
  describe('dev', () => {
    describe('addDevImage', () => {
      it('should encode special characters in the pathname', () => {
        const cache: DevCache = new Map()
        const pathname = addDevImage(cache, {
          path: '/images/my photo#1.jpg',
          contents: Buffer.from('contents'),
          format: 'jpg',
          width: 640,
          height: 480,
          postfix: '',
          originMultiplier: 1
        })

        expect(pathname).toMatch(/^\/@srcset\/my%20photo%231\.[0-9a-f]{8}\.jpg$/)
        expect(cache.has(pathname)).toBe(true)
      })
    })
  })
})
