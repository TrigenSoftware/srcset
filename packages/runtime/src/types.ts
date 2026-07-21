/**
 * Image format of the generated variant.
 */
export type ImageFormat = 'avif' | 'webp' | 'jpg' | 'png' | 'gif' | 'svg'

/**
 * Generated image variant.
 */
export interface SrcSetEntry {
  /**
   * Id, computed by the bundler from the variant format and width.
   */
  id: string
  /**
   * Image format.
   */
  format: ImageFormat
  /**
   * Image mime type.
   */
  type: string
  /**
   * Image width in pixels.
   */
  width: number
  /**
   * Image height in pixels. Unknown for runtime-built variants, like imgproxy urls.
   */
  height?: number
  /**
   * Image url.
   */
  url: string
}

