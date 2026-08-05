import {
  createHash,
  randomBytes
} from 'node:crypto'

const temporarySuffixLength = 4

/**
 * Hash the contents to verify a stored file against its manifest.
 * @param contents - File contents.
 * @returns Hex digest of the contents.
 */
export function getContentsHash(contents: Buffer) {
  return createHash('sha256').update(contents).digest('hex')
}

/**
 * Make a unique temporary name for the atomic write.
 * @param path - Target stored file path.
 * @returns Temporary file name.
 */
export function getTemporaryName(path: string) {
  return `${path}.${randomBytes(temporarySuffixLength).toString('hex')}.tmp`
}

/**
 * Assert the stored file path is flat: storage paths are plain file names,
 * anything else would escape the storage directory.
 * @param path - Stored file path.
 */
export function assertStoredPath(path: string) {
  if (!path || path === '.' || path === '..' || path.includes('/') || path.includes('\\')) {
    throw new Error(`Invalid stored file path: "${path}"`)
  }
}

/**
 * Serialize a value for the cache key.
 * Functions, like custom optimizers, are serialized by their source text.
 * @param value - Value to serialize.
 * @returns Serialized value.
 */
export function serialize(value: unknown) {
  return JSON.stringify(
    value,
    (_, item: unknown) => (typeof item === 'function' ? String(item) : item)
  )
}
