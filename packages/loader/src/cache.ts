import { join } from 'node:path'
import { SrcSetCacheStorage } from '@srcset/core'

const storages = new Map<string, SrcSetCacheStorage>()

/**
 * Get the disk cache storage shared between loader runs.
 * Every run of a compilation gets the same storage, so a variant
 * generated for one module is a hit for the next one.
 * @param context - Root context directory of the compiler.
 * @returns Cache storage.
 */
export function getSharedCache(context: string) {
  let storage = storages.get(context)

  if (!storage) {
    storage = new SrcSetCacheStorage(join(context, 'node_modules', '.cache', 'srcset'))
    storages.set(context, storage)
  }

  return storage
}
