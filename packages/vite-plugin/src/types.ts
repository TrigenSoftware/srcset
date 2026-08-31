import type {
  SrcSetCacheOptions,
  SrcSetModuleOptions
} from '@srcset/bundler-utils'

export interface SrcSetVitePluginOptions extends Omit<SrcSetModuleOptions, 'cache'> {
  /**
   * Cache generated variants on disk in the Vite cache directory:
   * repeated builds skip the generation. Enabled by default.
   * The dev server always uses the storage - variants are served from it.
   * Takes a `dir` and a `maxAge` to configure the storage.
   */
  cache?: boolean | SrcSetCacheOptions
  /**
   * Paths to process, picomatch pattern(s). Defaults to all image imports.
   */
  include?: string | RegExp | (string | RegExp)[]
  /**
   * Paths to skip, picomatch pattern(s). Defaults to `node_modules`.
   */
  exclude?: string | RegExp | (string | RegExp)[]
}
