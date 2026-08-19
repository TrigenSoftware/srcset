import sharp from 'sharp'
import {
  type GenerateContext,
  type ImageMetadata,
  type ImageSource,
  type SrcSetCacheStorage,
  type SrcSetImage,
  mimeTypes,
  renameImagePath
} from '@srcset/core'

const defaultWidth = 16
const defaultFormat = 'webp'
const placeholderPostfix = '.placeholder'

/**
 * Make a generate context for the placeholder variant: constant inputs,
 * distinct from the regular variants by the postfix.
 * @param source - Image file.
 * @param metadata - Image metadata.
 * @returns Generate context.
 */
function createPlaceholderContext(source: ImageSource, metadata: ImageMetadata): GenerateContext {
  return {
    source,
    metadata,
    processing: {},
    optimization: {},
    postfix: placeholderPostfix,
    skipOptimization: true,
    scalingUp: false
  }
}

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
 * @param metadata - Image metadata.
 * @param options - Placeholder options, `true` for the defaults.
 * @param limit - Concurrency limit for the sharp work.
 * @param cache - Cache storage: repeated creation reads the stored placeholder.
 * @returns Data-url string, or `undefined` when disabled.
 */
export async function createPlaceholder(
  source: ImageSource,
  metadata: ImageMetadata,
  options: PlaceholderOptions | boolean | undefined,
  limit: (task: () => Promise<Buffer>) => Promise<Buffer> = task => task(),
  cache?: SrcSetCacheStorage
): Promise<string | undefined> {
  if (!options) {
    return undefined
  }

  const {
    width = defaultWidth,
    format = defaultFormat
  } = options === true ? {} : options

  if (width <= 0 || !Number.isInteger(width)) {
    throw new Error(`Invalid placeholder width: ${String(width)}`)
  }

  const createImage = async (): Promise<SrcSetImage> => {
    const contents = await limit(() => {
      const pipeline = sharp(source.contents, {
        autoOrient: true
      }).resize({
        width,
        withoutEnlargement: true
      })

      return (format === 'webp' ? pipeline.webp() : pipeline.jpeg()).toBuffer()
    })
    // Informational dimensions: the data-url uses the contents only,
    // so sharp's own rounding of the height is not worth a second pass.
    const outputWidth = Math.min(width, metadata.width)

    return {
      path: renameImagePath(source.path, placeholderPostfix, format),
      contents,
      format,
      width: outputWidth,
      height: Math.round(metadata.height * outputWidth / metadata.width),
      postfix: placeholderPostfix,
      originMultiplier: null
    }
  }
  const image = cache
    ? await cache.memo(createPlaceholderContext(source, metadata), {
      format,
      width
    }, createImage)
    : await createImage()

  return `data:${mimeTypes[format]};base64,${image.contents.toString('base64')}`
}
