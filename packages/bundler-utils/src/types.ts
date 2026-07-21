import type {
  ImageFormat,
  Matcher,
  GenerateOptions
} from '@srcset/core'

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

/**
 * Image produced by a backend: the variant url and its properties.
 */
export interface SrcSetBackendImage {
  /**
   * Image format.
   */
  format: ImageFormat
  /**
   * Image width in pixels.
   */
  width: number
  /**
   * Image height in pixels.
   */
  height: number
  /**
   * Width multiplier relative to the original image, if the variant was requested with one.
   */
  originMultiplier: number | null
  /**
   * Image variant url: a plain url string, or the paths
   * of the image emitted with `EmitImage`.
   */
  url: string | SrcSetImagePaths
}

/**
 * Rule to generate image variants: match options plus generate options.
 */
export interface SrcSetRule extends GenerateOptions {
  /**
   * Rule(s) to match the image: glob, media query or matcher function.
   */
  match?: Matcher | Matcher[]
  /**
   * Do not apply the rest of the rules if this rule matched.
   */
  only?: boolean
}
