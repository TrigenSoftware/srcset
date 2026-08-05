import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  mkdir,
  readFile,
  rename,
  rm,
  writeFile
} from 'node:fs/promises'
import {
  join,
  parse
} from 'node:path'
import type { ImageFormat } from './formats.ts'
import type {
  GenerateContext,
  ImageVariant,
  SrcSetImage
} from './types.ts'
import { resolveVariant } from './path.ts'
import {
  assertStoredPath,
  getTemporaryName,
  getContentsHash,
  serialize
} from './cache.utils.ts'
import { environment } from './cache.version.ts'

/**
 * Address of a cached variant: the manifest key and the stored file path.
 */
export interface CacheAddress {
  /**
   * Manifest key of the variant.
   */
  key: string
  /**
   * Stored file path of the variant: the variant file name.
   */
  path: string
}

interface CacheEntry {
  path: string
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
 * The stored files are named by the variant file name from `SrcSetImage.path`,
 * and can be read back with `read` and `readStream`.
 */
export class SrcSetCacheStorage {
  private readonly dir: string

  constructor(dir: string) {
    this.dir = dir
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
        // Posix separators, so the keys are stable across platforms.
        path: source.path.replaceAll('\\', '/'),
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
      path: parse(resolveVariant(context, variant).path).base
    }
  }

  private async readEntry(address: CacheAddress): Promise<SrcSetImage | null> {
    try {
      const [entry, contents] = await Promise.all([
        this.read(`${address.key}.json`, 'utf8')
          .then(manifest => JSON.parse(manifest) as CacheEntry),
        this.read(address.path)
      ])

      // Variant names are not unique across sources and options:
      // a file overwritten by a colliding name is a miss.
      if (entry.hash !== getContentsHash(contents)) {
        return null
      }

      return {
        path: entry.path,
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

  private async writeEntry(address: CacheAddress, image: SrcSetImage) {
    const entry: CacheEntry = {
      path: image.path,
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
      this.write(`${address.key}.json`, JSON.stringify(entry))
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
    }

    return image
  }

  /**
   * Write contents to the storage. An existing file is overwritten:
   * variant names are not unique across option changes,
   * stale contents must not survive.
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
