import type {
  Matcher,
  GenerateOptions,
  SrcSetGeneratorOptions
} from '@srcset/core'

/**
 * Rule to generate image variants: match options plus generate options.
 */
export interface SrcSetCliRule extends GenerateOptions {
  /**
   * Rule(s) to match the image: glob, media query or matcher function.
   */
  match?: Matcher | Matcher[]
  /**
   * Keep matching the rest of the rules after this rule matched.
   * By default the first matched rule is the only one applied.
   */
  fallthrough?: boolean
}

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
  rules?: SrcSetCliRule[]
  /**
   * Print processed images.
   */
  verbose?: boolean
}
