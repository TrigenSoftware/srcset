import {
  describe,
  it,
  expect
} from 'vitest'
import {
  interpolateName,
  getDefaultName,
  defaultProductionName,
  defaultDevelopmentName
} from './template.ts'

const context = {
  contents: Buffer.from('image contents'),
  resourcePath: '/project/src/images/photo.jpg',
  context: '/project/src',
  postfix: '@320w',
  format: 'webp'
}

describe('loader', () => {
  describe('template', () => {
    describe('interpolateName', () => {
      it('should replace name, postfix and ext tokens', () => {
        expect(interpolateName('[name][postfix].[ext]', context)).toBe('photo@320w.webp')
      })

      it('should replace path token with directory relative to context', () => {
        expect(interpolateName('[path][name].[ext]', context)).toBe('images/photo.webp')
      })

      it('should replace path token with empty string for context directory', () => {
        expect(interpolateName('[path][name].[ext]', {
          ...context,
          resourcePath: '/project/src/photo.jpg'
        })).toBe('photo.webp')
      })

      it('should replace sourceext token for a converted image', () => {
        expect(interpolateName('[name][postfix][sourceext].[ext]', context)).toBe('photo@320w.jpg.webp')
      })

      it('should drop sourceext token when the format is kept', () => {
        expect(interpolateName('[name][postfix][sourceext].[ext]', {
          ...context,
          format: 'jpg'
        })).toBe('photo@320w.jpg')
        expect(interpolateName('[name][sourceext].[ext]', {
          ...context,
          resourcePath: '/project/src/photo.jpeg',
          format: 'jpg'
        })).toBe('photo.jpg')
      })

      it('should keep converted siblings apart with the default development name', () => {
        const jpg = interpolateName(defaultDevelopmentName, context)
        const png = interpolateName(defaultDevelopmentName, {
          ...context,
          resourcePath: '/project/src/images/photo.png'
        })

        expect(jpg).toBe('images/photo@320w.jpg.webp')
        expect(png).toBe('images/photo@320w.png.webp')
      })

      it('should replace contenthash token with given length', () => {
        const name = interpolateName('[contenthash:12].[ext]', context)

        expect(name).toMatch(/^[0-9a-f]{12}\.webp$/)
      })

      it('should replace hash token with default length', () => {
        expect(interpolateName('[hash].[ext]', context)).toMatch(/^[0-9a-f]{8}\.webp$/)
      })

      it('should produce same hash for same contents', () => {
        expect(interpolateName('[contenthash]', context)).toBe(interpolateName('[hash]', context))
      })
    })

    describe('getDefaultName', () => {
      it('should return hashless template for development mode', () => {
        expect(getDefaultName('development')).toBe(defaultDevelopmentName)
      })

      it('should return content hash template otherwise', () => {
        expect(getDefaultName('production')).toBe(defaultProductionName)
        expect(getDefaultName('none')).toBe(defaultProductionName)
        expect(getDefaultName(undefined)).toBe(defaultProductionName)
      })
    })
  })
})
