import {
  describe,
  it,
  expect
} from 'vitest'
import { mimeTypes } from './formats.ts'

describe('runtime', () => {
  describe('formats', () => {
    describe('mimeTypes', () => {
      it('should map formats to mime types', () => {
        expect(mimeTypes).toEqual({
          avif: 'image/avif',
          webp: 'image/webp',
          jpg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          svg: 'image/svg+xml'
        })
      })
    })
  })
})
