import {
  describe,
  it,
  expect
} from 'vitest'
import { renameImagePath } from './path.ts'

describe('core', () => {
  describe('path', () => {
    describe('renameImagePath', () => {
      it('should add postfix to file name', () => {
        expect(renameImagePath('/images/photo.jpg', '@320w', 'jpg')).toBe('/images/photo@320w.jpg')
      })

      it('should change extension to variant format', () => {
        expect(renameImagePath('/images/photo.jpg', '', 'webp')).toBe('/images/photo.webp')
      })

      it('should keep path without postfix as is', () => {
        expect(renameImagePath('/images/photo.jpg', '', 'jpg')).toBe('/images/photo.jpg')
      })

      it('should handle path without directory', () => {
        expect(renameImagePath('photo.jpg', '@2x', 'avif')).toBe('photo@2x.avif')
      })
    })
  })
})
