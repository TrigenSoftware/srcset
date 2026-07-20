import path from 'node:path/posix'
import type { ImageFormat } from './formats.ts'

/**
 * Add postfix and format extension to the image file path.
 * @param imagePath - Source image file path.
 * @param postfix - Postfix to add to the file name.
 * @param format - Image variant format.
 * @returns Image variant file path.
 */
export function renameImagePath(imagePath: string, postfix: string, format: ImageFormat) {
  // Posix separators, so variant paths are stable across platforms.
  const {
    dir,
    name
  } = path.parse(imagePath.replaceAll('\\', '/'))

  return path.format({
    dir,
    name: `${name}${postfix}`,
    ext: `.${format}`
  })
}
