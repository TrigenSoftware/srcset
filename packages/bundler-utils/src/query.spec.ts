import {
  describe,
  it,
  expect
} from 'vitest'
import { parseResourceQuery } from './query.ts'

describe('bundler-utils', () => {
  describe('query', () => {
    describe('parseResourceQuery', () => {
      it('should parse JSON rule', () => {
        expect(parseResourceQuery('?{ "width": [1, 0.5], "format": ["webp"] }')).toEqual({
          rules: [
            {
              width: [1, 0.5],
              format: ['webp']
            }
          ]
        })
      })

      it('should parse select params', () => {
        expect(parseResourceQuery('?id=jpg320&format=webp&width=320')).toEqual({
          select: {
            id: 'jpg320',
            format: 'webp',
            width: 320
          }
        })
      })

      it('should combine rule and select params', () => {
        expect(parseResourceQuery('?{ "width": [0.5, 1] }&width=320')).toEqual({
          rules: [
            {
              width: [0.5, 1]
            }
          ],
          select: {
            width: 320
          }
        })
      })

      it('should parse placeholder param', () => {
        expect(parseResourceQuery('?placeholder')).toEqual({
          placeholder: true
        })
        expect(parseResourceQuery('?placeholder=false')).toEqual({
          placeholder: false
        })
      })

      it('should ignore srcset marker and unknown params', () => {
        expect(parseResourceQuery('?srcset&unknown=1')).toEqual({})
      })

      it('should parse query without the leading question mark', () => {
        expect(parseResourceQuery('')).toEqual({})
        expect(parseResourceQuery('width=320')).toEqual({
          select: {
            width: 320
          }
        })
      })
    })
  })
})
