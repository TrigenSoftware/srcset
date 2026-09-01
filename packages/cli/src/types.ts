import type { SrcSetModuleOptions } from '@srcset/bundler-utils'

/**
 * Generated module flavour: the language, and whether the module goes
 * next to the variants or into a folder of its own named after the image.
 */
export type SrcSetModuleFormat = 'ts' | 'js' | 'ts-dir' | 'js-dir'

export interface SrcSetCliOptions extends Omit<SrcSetModuleOptions, 'cache'> {
  /**
   * Source image(s) glob patterns.
   */
  src: string | string[]
  /**
   * Destination directory.
   */
  dest: string
  /**
   * Generate an image module next to the variants, so a project can import
   * the baked images without a bundler integration. Off by default.
   * `placeholder`, `select` and `resourceId` shape the module, so without
   * it they do nothing.
   */
  module?: SrcSetModuleFormat
  /**
   * Print processed images.
   */
  verbose?: boolean
  /**
   * Not supported: a run of the cli is one-shot, so nothing configures
   * the storage and nothing prunes it afterwards.
   */
  cache?: never
  /**
   * Not supported: use `concurrency`.
   */
  limit?: never
}
