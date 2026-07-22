import type { SrcSetModuleOptions } from '@srcset/bundler-utils'

export interface SrcSetVitePluginOptions extends SrcSetModuleOptions {
  /**
   * Paths to process, picomatch pattern(s). Defaults to all image imports.
   */
  include?: string | RegExp | (string | RegExp)[]
  /**
   * Paths to skip, picomatch pattern(s). Defaults to `node_modules`.
   */
  exclude?: string | RegExp | (string | RegExp)[]
}
