import sharp from 'sharp'
import type {
  ImageSource,
  ImageMetadata
} from './types.ts'
import {
  normalizeFormat,
  isSupportedFormat,
  getFormatFromPath
} from './formats.ts'

const cache = new WeakMap<Buffer, ImageMetadata>()

/**
 * Read metadata of the image: normalized format, size and number of frames.
 * Results are cached by the contents buffer.
 * @param source - Image file.
 * @returns Image metadata.
 */
export async function getImageMetadata(source: ImageSource): Promise<ImageMetadata> {
  const cached = cache.get(source.contents)

  if (cached) {
    return cached
  }

  const {
    format,
    width,
    height,
    pages,
    pageHeight
  } = await sharp(source.contents).metadata()
  const normalizedFormat = normalizeFormat(format ?? getFormatFromPath(source.path))

  if (!isSupportedFormat(normalizedFormat)) {
    throw new Error(`Unsupported image format: "${String(normalizedFormat)}"`)
  }

  const metadata: ImageMetadata = {
    format: normalizedFormat,
    width: width ?? 0,
    height: pageHeight ?? height ?? 0,
    animated: (pages ?? 1) > 1
  }

  cache.set(source.contents, metadata)

  return metadata
}
