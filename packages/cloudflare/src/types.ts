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
 * Processing options builder: makes the transformation options segment for the variant.
 * E.g. ``({ width }) => `width=${width},format=auto` `` to let Cloudflare
 * negotiate the format by the `Accept` header.
 * @param variant - Image variant descriptor.
 * @returns Transformation options segment.
 */
export type ProcessingBuilder = (variant: SrcSetImageRequest) => string

export interface CloudflareOptions {
  /**
   * Image transformations endpoint: an absolute url, or a path
   * on the zone serving the site. Defaults to `/cdn-cgi/image`.
   */
  endpoint?: string
  /**
   * Return source urls untouched instead of building transformation urls,
   * e.g. for local development outside of a Cloudflare zone.
   */
  passthrough?: boolean
  /**
   * Quality of the variants for the default processing builder.
   */
  quality?: number
  /**
   * Processing options builder. Defaults to `width={width},format={format}[,quality={quality}]`.
   */
  processing?: ProcessingBuilder
}

/**
 * Rule to compute image variants.
 */
export interface CloudflareRule {
  /**
   * Output image format(s). Defaults to the url file extension.
   * The `src` fallback is the variant of the source format, or of the
   * first format of the list when the source format is not in it.
   */
  format?: ImageFormat | ImageFormat[]
  /**
   * Absolute output image width(s) in pixels: the source size
   * is unknown on the client, so multipliers can't be resolved.
   * Keep the widths within the source width: Cloudflare never
   * upscales, so a larger variant is served at the source width
   * and its `w` descriptor would mislead the browser.
   */
  width?: number | number[]
}
