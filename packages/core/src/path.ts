import path from 'node:path'
import type { ImageFormat } from './formats.ts'

/**
 * Add postfix and format extension to the image file path.
 * @param imagePath - Source image file path.
 * @param postfix - Postfix to add to the file name.
 * @param format - Image variant format.
 * @returns Image variant file path.
 */
export function renameImagePath(imagePath: string, postfix: string, format: ImageFormat) {
  const {
    dir,
    name
  } = path.parse(imagePath)

  return path.format({
    dir,
    name: `${name}${postfix}`,
    ext: `.${format}`
  })
}
