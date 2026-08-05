import sharp from 'sharp'

// Bump on any change that affects the generated output
// or the manifest format, beyond the sharp versions below.
const cacheVersion = 1

/**
 * Environment part of the cache key: the storage version
 * and the sharp versions, so encoder upgrades producing
 * different output invalidate the cache.
 */
export const environment = JSON.stringify({
  cacheVersion,
  versions: sharp.versions
})
