import type {
  SrcSetRule,
  SrcSetGeneratorOptions
} from '@srcset/core'

export interface SrcSetCliOptions extends SrcSetGeneratorOptions {
  /**
   * Source image(s) glob patterns.
   */
  src: string | string[]
  /**
   * Destination directory.
   */
  dest: string
  /**
   * Rules to generate image variants.
   */
  rules?: SrcSetRule[]
  /**
   * Print processed images.
   */
  verbose?: boolean
}
