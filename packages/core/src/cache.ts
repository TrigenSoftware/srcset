import { availableParallelism } from 'node:os'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile
} from 'node:fs/promises'
import {
  join,
  parse
} from 'node:path'
import pLimit from 'p-limit'
import type { ImageFormat } from './formats.ts'
import type {
  GenerateContext,
  ImageVariant,
  SrcSetImage
} from './types.ts'
import {
  toPosixPath,
  resolveVariant
} from './path.ts'
import {
  assertStoredPath,
  getTemporaryName,
  getContentsHash,
  serialize
} from './cache.utils.ts'
import { environment } from './cache.version.ts'

const storedPathSeparator = '-'
const manifestExtension = '.json'
const keyLength = 64
/* oxlint-disable no-magic-numbers -- a duration reads better than named parts */
const day = 24 * 60 * 60 * 1000
const defaultMaxAge = 30 * day
/* oxlint-enable no-magic-numbers */
// The used-at mark is rewritten at most once per this part of the max age:
// a mark is only needed to tell a used entry from an abandoned one.
const usedAtPrecision = 10
// A file without a readable manifest is either a leftover of a crash or
// a half-written entry of a build running right now: the grace period tells
// them apart without a lock.
/* oxlint-disable-next-line no-magic-numbers -- a duration reads better than named parts */
const orphanGrace = 5 * 60 * 1000
const keyPattern = /^[\da-f]{64}$/

/**
 * Make the stored file path of a variant: the storage is flat, so the
 * manifest key prefixes the variant file name - names alone are not
 * unique across sources and options.
 * @param key - Manifest key of the variant.
 * @param name - Variant file name.
 * @returns Stored file path.
 */
export function getStoredPath(key: string, name: string) {
  return `${key}${storedPathSeparator}${name}`
}

/**
 * Make the manifest path of an entry.
 * @param key - Manifest key of the variant.
 * @returns Manifest file path.
 */
function getManifestPath(key: string) {
  return `${key}${manifestExtension}`
}

/**
 * Get the manifest key a stored file belongs to. Anything that does not
 * look like an entry of this storage belongs to no key: the directory
 * is configurable, and files of other tools are not ours to remove.
 * @param path - Stored file name.
 * @returns Manifest key, or `null` for a foreign file.
 */
function getEntryKey(path: string) {
  const key = path.endsWith(manifestExtension)
    ? path.slice(0, -manifestExtension.length)
    : path.slice(0, keyLength)

  return keyPattern.test(key) ? key : null
}

/**
 * Address of a cached variant: the manifest key and the stored file path.
 */
export interface CacheAddress {
  /**
   * Manifest key of the variant.
   */
  key: string
  /**
   * Stored file path of the variant: the key-prefixed variant file name.
   */
  path: string
}

/**
 * Options of the cache storage.
 */
export interface SrcSetCacheStorageOptions {
  /**
   * Directory to store the variants and their manifests in.
   */
  dir: string
  /**
   * Maximum age of an unused entry in milliseconds. Defaults to 30 days.
   * Entries older than that are removed when the storage is first used.
   */
  maxAge?: number
}

interface CacheEntry {
  path: string
  usedAt: number
  hash: string
  format: ImageFormat
  width: number
  height: number
  postfix: string
  originMultiplier: number | null
}

/**
 * Disk storage of the generated image variants.
 *
 * `memo` skips repeated generation: the variant is stored on disk
 * together with its manifest, and the repeated generation with the same
 * source, options and variant reads it back instead of processing.
 * Function options, like custom optimizers, are keyed by their source text.
 * The stored files are named by the manifest key and the variant file name
 * from `SrcSetImage.path`, and can be read back with `read` and `readStream`
 * at the path made by `getStoredPath`.
 */
export class SrcSetCacheStorage {
  private readonly dir: string
  private readonly maxAge: number
  private pruning?: Promise<void>

  constructor(options: SrcSetCacheStorageOptions) {
    this.dir = options.dir
    this.maxAge = options.maxAge ?? defaultMaxAge
  }

  /**
   * Make a cache address for the variant: both parts are derived
   * from the generation inputs, so they are known before generating.
   * @param context - Generation inputs.
   * @param variant - Variant to generate, `null` for the SVG passthrough.
   * @returns Manifest key and stored file path of the variant.
   */
  getKey(context: GenerateContext, variant: ImageVariant | null): CacheAddress {
    const {
      source,
      processing,
      optimization,
      postfix,
      skipOptimization,
      scalingUp
    } = context
    const key = createHash('sha256')
      .update(environment)
      .update(source.contents)
      .update(serialize({
        path: toPosixPath(source.path),
        variant,
        processing,
        optimization,
        postfix,
        skipOptimization,
        scalingUp
      }))
      .digest('hex')

    return {
      key,
      path: getStoredPath(key, parse(resolveVariant(context, variant).path).base)
    }
  }

  private async readEntry(address: CacheAddress): Promise<SrcSetImage | null> {
    try {
      const [entry, contents] = await Promise.all([
        this.read(getManifestPath(address.key), 'utf8')
          .then(manifest => JSON.parse(manifest) as CacheEntry),
        this.read(address.path)
      ])

      // The stored path is keyed, so a mismatch means a damaged
      // or half-written file rather than another entry: regenerate.
      if (entry.hash !== getContentsHash(contents)) {
        return null
      }

      await this.markUsed(address.key, entry)

      return {
        path: entry.path,
        cacheKey: address.key,
        contents,
        format: entry.format,
        width: entry.width,
        height: entry.height,
        postfix: entry.postfix,
        originMultiplier: entry.originMultiplier
      }
    } catch {
      // No entry, or a stored file was cleaned away: generate.
      return null
    }
  }

  /**
   * Keep the used-at mark of a hit entry fresh, so pruning tells
   * an entry still in use from an abandoned one. The mark lives in the
   * manifest rather than in the file mtime: archives do not always
   * carry timestamps, contents always survive.
   * @param key - Manifest key of the entry.
   * @param entry - Manifest of the entry.
   */
  private async markUsed(key: string, entry: CacheEntry) {
    const now = Date.now()

    if (now - entry.usedAt < this.maxAge / usedAtPrecision) {
      return
    }

    try {
      await this.write(getManifestPath(key), JSON.stringify({
        ...entry,
        usedAt: now
      }))
    } catch {}
  }

  private async writeEntry(address: CacheAddress, image: SrcSetImage) {
    const entry: CacheEntry = {
      path: image.path,
      usedAt: Date.now(),
      hash: getContentsHash(image.contents),
      format: image.format,
      width: image.width,
      height: image.height,
      postfix: image.postfix,
      originMultiplier: image.originMultiplier
    }

    // Partial states are safe to write in parallel: a manifest without
    // its file is a read miss with regeneration.
    await Promise.all([
      this.write(address.path, image.contents),
      this.write(getManifestPath(address.key), JSON.stringify(entry))
    ])
  }

  /**
   * Memoize the variant generation: read the stored variant,
   * or generate and store it.
   * @param context - Generation inputs.
   * @param variant - Variant to generate, `null` for the SVG passthrough.
   * @param fn - Variant generator function.
   * @returns Generated image variant, or `null` if the variant is skipped.
   */
  async memo<T extends SrcSetImage | null>(
    context: GenerateContext,
    variant: ImageVariant | null,
    fn: () => Promise<T>
  ): Promise<T | SrcSetImage> {
    const address = this.getKey(context, variant)
    const cached = await this.readEntry(address)

    if (cached) {
      return cached
    }

    const image = await fn()

    if (image) {
      await this.writeEntry(address, image)

      return {
        ...image,
        cacheKey: address.key
      }
    }

    return image
  }

  /**
   * Remove the entries unused for longer than the max age. Call it when
   * a build is over: pruning before the reads would drop the entries the
   * build is about to hit, whose marks it has not refreshed yet.
   * Runs once per storage instance.
   * @returns Promise of the removal.
   */
  async prune() {
    this.pruning ??= this.removeStale()

    return this.pruning
  }

  private async removeStale() {
    let paths: string[]

    try {
      paths = await readdir(this.dir)
    } catch {
      // No storage directory yet: nothing to remove.
      return
    }

    const entries = new Map<string, string[]>()

    for (const path of paths) {
      const key = getEntryKey(path)

      if (!key) {
        continue
      }

      const entryPaths = entries.get(key)

      if (entryPaths) {
        entryPaths.push(path)
      } else {
        entries.set(key, [path])
      }
    }

    const deadline = Date.now() - this.maxAge
    const limit = pLimit(availableParallelism())

    await Promise.all([...entries].map(([key, entryPaths]) => limit(async () => {
      if (!await this.isStale(key, entryPaths, deadline)) {
        return
      }

      // A file another build reads right now is safe to unlink on posix,
      // and locked on windows - either way the failure is not ours to handle.
      await Promise.all(entryPaths.map(async (path) => {
        try {
          await rm(join(this.dir, path), {
            force: true
          })
        } catch {}
      }))
    })))
  }

  private async isStale(key: string, entryPaths: string[], deadline: number) {
    let manifest: string

    try {
      manifest = await this.read(getManifestPath(key), 'utf8')
    } catch (error) {
      // Only a missing manifest makes an entry unusable. A read that failed
      // for any other reason says nothing about the entry: keep it.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        return false
      }

      return this.isAbandoned(entryPaths)
    }

    try {
      const { usedAt } = JSON.parse(manifest) as CacheEntry

      // A mark of an older storage version, or a damaged one: the entry
      // is unusable either way, and an unusable entry is stale.
      return !Number.isFinite(usedAt) || usedAt < deadline
    } catch {
      return true
    }
  }

  /**
   * Tell a leftover of a crashed build from an entry a running build
   * is writing right now: the latter is younger than the grace period.
   * @param entryPaths - Stored files of the entry.
   * @returns Whether the files are safe to remove.
   */
  private async isAbandoned(entryPaths: string[]) {
    const deadline = Date.now() - orphanGrace

    try {
      const stats = await Promise.all(
        entryPaths.map(path => stat(join(this.dir, path)))
      )

      return stats.every(({ mtimeMs }) => mtimeMs < deadline)
    } catch {
      return false
    }
  }

  /**
   * Write contents to the storage. An existing file is overwritten:
   * a repeated write of the same path carries the same contents.
   * @param path - Stored file path.
   * @param contents - File contents.
   * @returns Stored file path.
   */
  async write(path: string, contents: Buffer | string) {
    assertStoredPath(path)
    await mkdir(this.dir, {
      recursive: true
    })

    // Write to a temporary file and rename: renames are atomic within
    // the directory, so a concurrent reader never sees partial contents.
    const temporaryPath = join(this.dir, getTemporaryName(path))

    try {
      await writeFile(temporaryPath, contents)
      await rename(temporaryPath, join(this.dir, path))
    } catch (error) {
      // Cleanup failures are secondary: keep the original write error.
      try {
        await rm(temporaryPath, {
          force: true
        })
      } catch {}

      throw error
    }

    return path
  }

  async read(path: string): Promise<Buffer>
  async read(path: string, encoding: BufferEncoding): Promise<string>

  /**
   * Read the stored file contents.
   * @param path - Stored file path from the cache address.
   * @param encoding - Text encoding to decode the contents with.
   * @returns File contents: a buffer, or a string when the encoding is set.
   */
  async read(path: string, encoding?: BufferEncoding): Promise<Buffer | string> {
    assertStoredPath(path)

    return readFile(join(this.dir, path), encoding)
  }

  /**
   * Create a read stream of the stored file.
   * @param path - Stored file path from the cache address.
   * @returns Readable stream of the file contents.
   */
  readStream(path: string) {
    assertStoredPath(path)

    return createReadStream(join(this.dir, path))
  }
}
