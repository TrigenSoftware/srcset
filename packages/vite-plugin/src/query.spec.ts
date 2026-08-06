import {
  describe,
  it,
  expect
} from 'vitest'
import { createFilter } from 'vite'
import {
  createLoadFilter,
  splitId
} from './query.ts'

function createMatcher(include?: Parameters<typeof createLoadFilter>[0], exclude?: Parameters<typeof createLoadFilter>[1]) {
  const filter = createLoadFilter(include, exclude)

  return createFilter(filter.id.include, filter.id.exclude)
}

describe('vite-plugin', () => {
  describe('query', () => {
    describe('createLoadFilter', () => {
      it('should match image ids with and without query by default', () => {
        const matches = createMatcher()

        expect(matches('/images/photo.jpg')).toBe(true)
        expect(matches('/images/photo.avif')).toBe(true)
        expect(matches('/images/photo.jpg?width=320&format=webp')).toBe(true)
        expect(matches('/images/photo.jpg?{ "width": [1, 0.5] }')).toBe(true)
      })

      it('should not match non-image ids', () => {
        const matches = createMatcher()

        expect(matches('/scripts/main.ts')).toBe(false)
        expect(matches('/images/icon.svg')).toBe(false)
      })

      it('should not match native Vite queries', () => {
        const matches = createMatcher()

        expect(matches('/images/photo.jpg?url')).toBe(false)
        expect(matches('/images/photo.jpg?raw')).toBe(false)
        expect(matches('/images/photo.jpg?inline')).toBe(false)
        expect(matches('/images/photo.jpg?width=320&url')).toBe(false)
      })

      it('should not match virtual module ids', () => {
        const matches = createMatcher()

        expect(matches('\u0000virtual:module')).toBe(false)
      })

      it('should not match node_modules by default', () => {
        const matches = createMatcher()

        expect(matches('/project/node_modules/pkg/photo.jpg')).toBe(false)
      })

      it('should respect user include and exclude patterns', () => {
        const filter = createLoadFilter('src/hero/**', ['**/skip/**'])

        expect(filter.id.include).toEqual(['src/hero/**'])
        expect(filter.id.exclude[2]).toBe('**/skip/**')
      })
    })

    describe('splitId', () => {
      it('should split id into path and query', () => {
        expect(splitId('/images/photo.jpg?srcset')).toEqual({
          path: '/images/photo.jpg',
          query: 'srcset'
        })
      })

      it('should return empty query without question mark', () => {
        expect(splitId('/images/photo.jpg')).toEqual({
          path: '/images/photo.jpg',
          query: ''
        })
      })
    })
  })
})
