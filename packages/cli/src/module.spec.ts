import { join } from 'node:path'
import {
  describe,
  it,
  expect
} from 'vitest'
import {
  toIdentifier,
  withImports
} from './module.ts'

describe('cli', () => {
  describe('module', () => {
    describe('toIdentifier', () => {
      it('should keep the extension as a part of the identifier', () => {
        const used = new Set<string>()

        expect(toIdentifier('photo.jpg', used)).toBe('photo_jpg')
        expect(toIdentifier('photo.webp', used)).toBe('photo_webp')
      })

      it('should take the file name of a path', () => {
        expect(toIdentifier(join('images', 'photo.jpg'), new Set())).toBe('photo_jpg')
      })

      it('should replace the characters an identifier cannot hold', () => {
        expect(toIdentifier('photo@320w.jpg', new Set())).toBe('photo_320w_jpg')
        expect(toIdentifier("it's.jpg", new Set())).toBe('it_s_jpg')
      })

      it('should prefix an identifier starting with a digit', () => {
        expect(toIdentifier('1.jpg', new Set())).toBe('_1_jpg')
      })

      it('should suffix the identifiers taken by other variants', () => {
        const used = new Set<string>()

        expect(toIdentifier('photo@320w.jpg', used)).toBe('photo_320w_jpg')
        expect(toIdentifier('photo_320w.jpg', used)).toBe('photo_320w_jpg_1')
        expect(toIdentifier('photo-320w.jpg', used)).toBe('photo_320w_jpg_2')
      })
    })

    describe('withImports', () => {
      it('should prepend the imports of the variants', () => {
        expect(withImports([
          ['photo_jpg', 'photo.jpg'],
          ['photo_webp', 'photo.webp']
        ], 'export default photo_jpg;\n')).toBe(
          'import photo_jpg from "./photo.jpg"\nimport photo_webp from "./photo.webp"\n\nexport default photo_jpg;\n'
        )
      })

      it('should escape a file name the specifier cannot hold', () => {
        expect(withImports([['it_s_jpg', "it's.jpg"]], '')).toContain(
          'import it_s_jpg from "./it\'s.jpg"'
        )
      })

      it('should keep the module as is without imports', () => {
        expect(withImports([], 'export default null;\n')).toBe('export default null;\n')
      })
    })
  })
})
