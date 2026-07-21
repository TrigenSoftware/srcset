import sharp from 'sharp'
import {
  type ImageSource,
  mimeTypes
} from '@srcset/core'

const defaultWidth = 16
const defaultFormat = 'webp'

/**
 * Options of the `placeholder` module export.
 */
export interface PlaceholderOptions {
  /**
   * Placeholder width in pixels.
   */
  width?: number
  /**
   * Placeholder format.
   */
  format?: 'webp' | 'jpg'
}

/**
 * Create a tiny data-url variant of the image for blur-up placeholders.
 * @param source - Image file.
 * @param options - Placeholder options, `true` for the defaults.
 * @returns Data-url string, or `undefined` when disabled.
 */
export async function createPlaceholder(
  source: ImageSource,
  options: PlaceholderOptions | boolean | undefined
): Promise<string | undefined> {
  if (!options) {
    return undefined
  }

  const {
    width = defaultWidth,
    format = defaultFormat
  } = options === true ? {} : options
  const pipeline = sharp(source.contents).resize({
    width,
    withoutEnlargement: true
  })
  const contents = await (format === 'webp' ? pipeline.webp() : pipeline.jpeg()).toBuffer()

  return `data:${mimeTypes[format]};base64,${contents.toString('base64')}`
}
