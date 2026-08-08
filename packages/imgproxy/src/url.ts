import type {
  SrcSetImageRequest,
  ImgproxySigner,
  ProcessingBuilder
} from './types.ts'

const INSECURE_SIGNATURE = 'insecure'

/**
 * Create the default processing options builder: `w:{width}/f:{format}[/q:{quality}]`.
 * @param quality - Quality of the variants.
 * @returns Processing options builder.
 */
export function createDefaultProcessing(quality?: number): ProcessingBuilder {
  return ({
    format,
    width
  }) => `w:${width}/f:${format}${quality ? `/q:${quality}` : ''}`
}

// The url is always base64-encoded: the plain form needs escaping
// of query strings, percent and at signs, and non-ascii characters.
function encodeSourceUrl(sourceUrl: string) {
  // Utf-8 bytes first: `btoa` throws on characters above `\u00ff`.
  const bytes = new TextEncoder().encode(sourceUrl)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/**
 * Build an imgproxy url for the image variant.
 * @param endpoint - imgproxy endpoint url.
 * @param processing - Processing path segment.
 * @param sourceUrl - Source image url.
 * @param signer - Url path signer, `insecure` signature without it.
 * @returns imgproxy url.
 */
export function buildImgproxyUrl(
  endpoint: string,
  processing: string,
  sourceUrl: string,
  signer?: ImgproxySigner
) {
  const path = `/${processing}/${encodeSourceUrl(sourceUrl)}`
  const signature = signer ? signer(path) : INSECURE_SIGNATURE

  return `${endpoint.replace(/\/$/, '')}/${signature}${path}`
}

export type { SrcSetImageRequest }
