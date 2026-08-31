import { join } from 'node:path'
import type { SrcSetCacheOptions } from '@srcset/bundler-utils'
import { SrcSetCacheStorage } from '@srcset/core'

const storages = new Map<string, SrcSetCacheStorage>()

/**
 * Get the disk cache storage shared between loader runs.
 * Every run of a compilation gets the same storage, so a variant
 * generated for one module is a hit for the next one.
 * @param context - Root context directory of the compiler.
 * @param cache - Cache option of the loader: `true` for the defaults.
 * @returns Cache storage.
 */
export function getSharedCache(
  context: string,
  cache: true | SrcSetCacheOptions
) {
  const options = cache === true ? {} : cache
  const dir = options.dir ?? join(context, 'node_modules', '.cache', 'srcset')
  // Two configurations of one directory are two storages: sharing the first
  // one would silently apply its max age to both.
  const id = `${dir}\n${options.maxAge ?? ''}`
  let storage = storages.get(id)

  if (!storage) {
    storage = new SrcSetCacheStorage({
      ...options,
      dir
    })
    storages.set(id, storage)
  }

  return storage
}
