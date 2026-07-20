import path from 'node:path'

export const supportedFormats = [
  'avif',
  'webp',
  'jpg',
  'png',
  'gif',
  'svg'
] as const

export type ImageFormat = typeof supportedFormats[number]

/**
 * Mime types of supported image formats.
 */
export const mimeTypes: Record<ImageFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml'
}

const formatAliases: Record<string, ImageFormat> = {
  jpeg: 'jpg',
  heif: 'avif'
}

/**
 * Normalize image format name: lowercase and resolve aliases, like `jpeg` -> `jpg`.
 * @param format - Image format name or alias.
 * @returns Normalized image format name.
 */
export function normalizeFormat(format: string) {
  const lowercased = format.toLowerCase()

  return formatAliases[lowercased] ?? lowercased
}

/**
 * Check image format is supported.
 * @param format - Normalized image format name.
 * @returns Image format is supported or not.
 */
export function isSupportedFormat(format: string): format is ImageFormat {
  return (supportedFormats as readonly string[]).includes(format)
}

/**
 * Get normalized image format name from file path.
 * @param filePath - Image file path.
 * @returns Normalized image format name.
 */
export function getFormatFromPath(filePath: string) {
  return normalizeFormat(path.extname(filePath).slice(1))
}
