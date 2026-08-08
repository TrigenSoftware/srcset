import {
  describe,
  it,
  expect
} from 'vitest'
import { toArray } from './utils.ts'

describe('cloudflare', () => {
  describe('utils', () => {
    describe('toArray', () => {
      it('should return array as is', () => {
        const value = [1, 2]

        expect(toArray(value)).toBe(value)
      })

      it('should wrap single value', () => {
        expect(toArray(1)).toEqual([1])
      })

      it('should fall back for undefined', () => {
        expect(toArray(undefined, 1)).toEqual([1])
        expect(toArray(undefined)).toEqual([])
      })
    })
  })
})
