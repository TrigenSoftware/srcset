import type { ImageFormat } from '@srcset/runtime'
import type {
  SrcSetImageRequest,
  ProcessingBuilder
} from './types.ts'

export const DEFAULT_ENDPOINT = '/cdn-cgi/image'

// Cloudflare can force only these output formats, the rest pass through as is.
const CLOUDFLARE_FORMATS: Partial<Record<ImageFormat, string>> = {
  jpg: 'jpeg',
  webp: 'webp',
  avif: 'avif'
}

/**
 * Check that Cloudflare can output the format for the source:
 * jpeg, webp and avif can be forced, a non-forceable format
 * is only valid as the source format passing through unconverted.
 * @param format - Output image format.
 * @param sourceFormat - Source image format.
 * @returns Whether Cloudflare can output the format.
 */
export function canOutputFormat(format: ImageFormat, sourceFormat: ImageFormat) {
  return Object.hasOwn(CLOUDFLARE_FORMATS, format) || format === sourceFormat
}

/**
 * Create the default processing options builder: `width={width},format={format}[,quality={quality}]`.
 * Formats Cloudflare can not force (png, gif, svg) go without the `format` option.
 * @param quality - Quality of the variants.
 * @returns Processing options builder.
 */
export function createDefaultProcessing(quality?: number): ProcessingBuilder {
  return ({
    format,
    width
  }) => {
    const outputFormat = CLOUDFLARE_FORMATS[format]

    return `width=${width}${outputFormat ? `,format=${outputFormat}` : ''}${quality ? `,quality=${quality}` : ''}`
  }
}

/**
 * Build a Cloudflare image transformations url for the image variant.
 * @param endpoint - Image transformations endpoint.
 * @param processing - Transformation options segment.
 * @param sourceUrl - Source image url: absolute, or a path resolved against the zone.
 * @returns Cloudflare url.
 */
export function buildCloudflareUrl(
  endpoint: string,
  processing: string,
  sourceUrl: string
) {
  // Path source goes without the leading slash: /cdn-cgi/image/width=800/assets/image.jpg
  const source = sourceUrl.startsWith('/') ? sourceUrl.slice(1) : sourceUrl

  return `${endpoint.replace(/\/$/, '')}/${processing}/${source}`
}

export type { SrcSetImageRequest }
