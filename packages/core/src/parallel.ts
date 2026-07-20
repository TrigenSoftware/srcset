import { availableParallelism } from 'node:os'
import type { LimitFunction } from 'p-limit'
import pLimit from 'p-limit'

/**
 * Parallel handler.
 * @param item - Item to handle.
 * @param index - Item index.
 * @returns Result to yield, nullish results are skipped.
 */
export type ParallelHandler<T, R> = (item: T, index: number) => Promise<R>

/**
 * Handle items in parallel, yielding non-nullish results in the original order.
 * @param items - Items to handle.
 * @param handler - Handler function.
 * @param limit - p-limit's limit function.
 * @yields Non-nullish results of handling.
 */
export async function* parallel<T, R>(
  items: T[],
  handler: ParallelHandler<T, R>,
  limit: LimitFunction = pLimit(availableParallelism())
): AsyncGenerator<NonNullable<Awaited<R>>, void> {
  const tasks = items.map((item, index) => limit(() => handler(item, index)))
  const final = Promise.allSettled(tasks)

  try {
    for (const task of tasks) {
      const result = await task

      if (result !== null && result !== undefined) {
        yield result
      }
    }
  } finally {
    await final
  }
}
