import { availableParallelism } from 'node:os'
import type { LimitFunction } from 'p-limit'
import pLimit from 'p-limit'

const limits = new Map<number | undefined, LimitFunction>()

/**
 * Get concurrency limit shared between loader runs.
 * @param concurrency - Concurrency limit.
 * @returns p-limit's limit function.
 */
export function getSharedLimit(concurrency?: number) {
  let limit = limits.get(concurrency)

  if (!limit) {
    limit = pLimit(concurrency ?? availableParallelism())
    limits.set(concurrency, limit)
  }

  return limit
}
