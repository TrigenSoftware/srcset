import type { ImageFormat } from './types.ts'

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
