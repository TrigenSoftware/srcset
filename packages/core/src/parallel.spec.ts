import {
  describe,
  it,
  expect
} from 'vitest'
import pLimit from 'p-limit'
import { parallel } from './parallel.ts'

async function collect<T>(iterator: AsyncGenerator<T, void>) {
  const items: T[] = []

  for await (const item of iterator) {
    items.push(item)
  }

  return items
}

describe('core', () => {
  describe('parallel', () => {
    describe('parallel', () => {
      it('should yield results in the original order', async () => {
        const results = await collect(parallel(
          [4, 3, 2, 1],
          async (num) => {
            await new Promise((resolve) => {
              setTimeout(resolve, num * 10)
            })

            return num * num
          }
        ))

        expect(results).toEqual([16, 9, 4, 1])
      })

      it('should skip nullish results', async () => {
        const results = await collect(parallel(
          [1, 2, 3, 4],
          num => Promise.resolve(num % 2 ? num : null)
        ))

        expect(results).toEqual([1, 3])
      })

      it('should respect concurrency limit', async () => {
        let active = 0
        let maxActive = 0

        await collect(parallel(
          [1, 2, 3, 4],
          async (num) => {
            active += 1
            maxActive = Math.max(maxActive, active)

            await new Promise((resolve) => {
              setTimeout(resolve, 10)
            })

            active -= 1

            return num
          },
          pLimit(1)
        ))

        expect(maxActive).toBe(1)
      })

      it('should not trigger unhandled rejection when task fails while earlier task is awaited', async () => {
        await expect(collect(parallel(
          [1, 2],
          (num) => {
            if (num === 2) {
              return Promise.reject(new Error('Fast failure'))
            }

            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(num)
              }, 50)
            })
          }
        ))).rejects.toThrow('Fast failure')

        // Let the unhandled rejection checkpoint pass.
        await new Promise((resolve) => {
          setTimeout(resolve, 10)
        })
      })

      it('should rethrow handler error', async () => {
        await expect(collect(parallel(
          [1, 2],
          (num) => {
            if (num === 2) {
              return Promise.reject(new Error('Handler error'))
            }

            return Promise.resolve(num)
          }
        ))).rejects.toThrow('Handler error')
      })
    })
  })
})
