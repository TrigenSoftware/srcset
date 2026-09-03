import type { ImageFormat } from '@srcset/runtime'

/**
 * Descriptor of the image variant to build an url for.
 */
export interface SrcSetImageRequest {
  /**
   * Image variant format.
   */
  format: ImageFormat
  /**
   * Width of the image variant in pixels.
   */
  width: number
}

/**
 * Processing options builder: makes the processing path segment for the variant.
 * The way to use imgproxy presets, e.g. ``({ format, width }) => `pr:card_${format}_${width}` ``.
 * @param variant - Image variant descriptor.
 * @returns Processing path segment.
 */
export type ProcessingBuilder = (variant: SrcSetImageRequest) => string

/**
 * Url path signer.
 * @param path - Url path to sign, starting with `/`.
 * @returns Signature string.
 */
export type ImgproxySigner = (path: string) => string

export interface ImgproxyOptions {
  /**
   * imgproxy endpoint url.
   */
  endpoint: string
  /**
   * Return source urls untouched instead of building imgproxy urls,
   * e.g. for local development without a running imgproxy instance.
   */
  passthrough?: boolean
  /**
   * Url path signer, e.g. created with `sign` from `@srcset/imgproxy/sign`.
   * Without a signer urls are built with the `insecure` signature.
   * Do not sign urls in the browser - it leaks the keys; sign on the server or use presets.
   */
  signer?: ImgproxySigner
  /**
   * Quality of the variants for the default processing builder.
   */
  quality?: number
  /**
   * Processing options builder. Defaults to `w:{width}/f:{format}[/q:{quality}]`.
   */
  processing?: ProcessingBuilder
}

/**
 * Rule to compute image variants.
 */
export interface ImgproxyRule {
  /**
   * Output image format(s). Defaults to the url file extension.
   * The `src` fallback is the variant of the source format, or of the
   * first format of the list when the source format is not in it.
   */
  format?: ImageFormat | ImageFormat[]
  /**
   * Absolute output image width(s) in pixels: the source size
   * is unknown on the client, so multipliers can't be resolved.
   */
  width?: number | number[]
}
