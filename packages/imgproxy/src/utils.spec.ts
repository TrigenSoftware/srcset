import {
  describe,
  it,
  expect
} from 'vitest'
import { toUniqArray } from './utils.ts'

describe('imgproxy', () => {
  describe('utils', () => {
    describe('toUniqArray', () => {
      it('should deduplicate an array', () => {
        expect(toUniqArray([1, 2, 1])).toEqual([1, 2])
      })

      it('should keep the order of the first occurrences', () => {
        expect(toUniqArray([2, 1, 2, 3])).toEqual([2, 1, 3])
      })

      it('should wrap single value', () => {
        expect(toUniqArray(1)).toEqual([1])
      })

      it('should fall back for undefined', () => {
        expect(toUniqArray(undefined, 1)).toEqual([1])
        expect(toUniqArray(undefined)).toEqual([])
      })
    })
  })
})
