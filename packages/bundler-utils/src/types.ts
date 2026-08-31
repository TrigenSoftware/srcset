import type { SrcSetCacheStorageOptions } from '@srcset/core'

/**
 * Disk cache options of a srcset bundler integration.
 */
export interface SrcSetCacheOptions extends Omit<SrcSetCacheStorageOptions, 'dir'> {
  /**
   * Directory of the cache storage. Defaults to a directory
   * inside the cache directory of the bundler.
   */
  dir?: string
}

/**
 * Paths of an image emitted on the bundler side.
 */
export interface SrcSetImagePaths {
  /**
   * Path of the emitted image in the build output.
   */
  outputPath: string
  /**
   * Public url of the emitted image, when known as a plain string at the build time.
   */
  publicPath: string | null
  /**
   * JS expression of the public path prefix for the url expression,
   * when the public path is not known as a plain string,
   * e.g. `__webpack_public_path__` of webpack.
   */
  publicPathExpression?: string
}
