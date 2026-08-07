import type {
  SrcSetEntry,
  ImageFormat
} from '@srcset/runtime'

const mimeTypes: Record<ImageFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml'
}

/**
 * Create an image variant stub.
 * @param format - Image format.
 * @param width - Image width.
 * @param height - Image height.
 * @returns Image variant.
 */
export function createSrc(format: ImageFormat, width: number, height = Math.round(width * 0.75)): SrcSetEntry {
  return {
    id: `${format}${width}`,
    format,
    type: mimeTypes[format],
    width,
    height,
    url: `/images/image@${width}w.${format}`
  }
}

/**
 * Create a set of image variant stubs.
 * @param format - Image format.
 * @param widths - Image widths.
 * @returns Set of image variants.
 */
export function createSrcSet(format: ImageFormat, widths: number[]): SrcSetEntry[] {
  return widths.map(width => createSrc(format, width))
}
