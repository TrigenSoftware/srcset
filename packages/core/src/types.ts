import type {
  AvifOptions,
  WebpOptions,
  JpegOptions,
  PngOptions,
  GifOptions
} from 'sharp'
import type { LimitFunction } from 'p-limit'
import type { ImageFormat } from './formats.ts'

/**
 * Source image file.
 */
export interface ImageSource {
  /**
   * Image file path.
   */
  path: string
  /**
   * Image file contents.
   */
  contents: Buffer
}

/**
 * Image metadata.
 */
export interface ImageMetadata {
  /**
   * Normalized image format name.
   */
  format: ImageFormat
  /**
   * Image width in pixels.
   */
  width: number
  /**
   * Image height in pixels. For animated images - height of a single frame.
   */
  height: number
  /**
   * Image has more than one frame.
   */
  animated: boolean
}

/**
 * Generated image variant.
 */
export interface SrcSetImage {
  /**
   * Image file path with postfix and format extension applied.
   */
  path: string
  /**
   * Image file contents.
   */
  contents: Buffer
  /**
   * Normalized image format name.
   */
  format: ImageFormat
  /**
   * Image width in pixels.
   */
  width: number
  /**
   * Image height in pixels. For animated images - height of a single frame.
   */
  height: number
  /**
   * Postfix applied to the image file name.
   */
  postfix: string
  /**
   * Width multiplier relative to the original image, if the variant was requested with one.
   */
  originMultiplier: number | null
}

/**
 * Object with [sharp output options](https://sharp.pixelplumbing.com/api-output/) for each supported format.
 *
 * Example:
 * ```js
 * {
 *     webp: {
 *         quality: 75
 *     },
 *     jpg: {
 *         mozjpeg: true
 *     }
 * }
 * ```
 */
export interface ProcessingOptions {
  avif?: AvifOptions
  webp?: WebpOptions
  jpg?: JpegOptions
  png?: PngOptions
  gif?: GifOptions
}

/**
 * Custom optimizer function, applied to the encoded image contents.
 */
export type ImageOptimizer = (contents: Buffer, format: ImageFormat) => Buffer | Promise<Buffer>

/**
 * Object with custom optimizer functions for each supported format.
 * The only way to optimize SVG images, e.g. with `svgo`.
 */
export type OptimizationOptions = Partial<Record<ImageFormat, ImageOptimizer>>

/**
 * Postfix formatter function.
 * @param width - Actual width of the image variant in pixels.
 * @param requestedWidth - Width as it was requested: absolute value or multiplier less than or equal to 1.
 * @param format - Image variant format.
 * @returns Postfix string.
 */
export type PostfixFormatter = (width: number, requestedWidth: number, format: ImageFormat) => string

/**
 * Postfix string or formatter function.
 */
export type Postfix = string | PostfixFormatter

export interface SrcSetGeneratorOptions {
  /**
   * Object with sharp output options for each supported format.
   */
  processing?: ProcessingOptions
  /**
   * Object with custom optimizer functions for each supported format.
   */
  optimization?: OptimizationOptions
  /**
   * Do not re-encode the original image variant and skip custom optimizers.
   */
  skipOptimization?: boolean
  /**
   * Emit variants with requested width higher than the original width. Pixels are never upscaled.
   */
  scalingUp?: boolean
  /**
   * Postfix string or formatter function.
   */
  postfix?: Postfix
  /**
   * Concurrency limit. Ignored when `limit` is provided.
   */
  concurrency?: number
  /**
   * p-limit's limit function, e.g. to share one limit between several generators.
   */
  limit?: LimitFunction
}

export interface GenerateOptions extends Omit<SrcSetGeneratorOptions, 'concurrency' | 'limit'> {
  /**
   * Output image format(s) to convert. Defaults to the source image format.
   */
  format?: ImageFormat | ImageFormat[]
  /**
   * Output image width(s) to resize. Value less than or equal to 1 is treated as a multiplier.
   */
  width?: number | number[]
}
