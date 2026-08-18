import path from 'node:path/posix'
import type { ImageFormat } from './formats.ts'
import type {
  GenerateContext,
  ImageVariant,
  Postfix
} from './types.ts'

/**
 * Convert a file path to posix separators, so paths are stable
 * across platforms: bundlers feed native and posix paths alike.
 * @param filePath - File path in any platform form.
 * @returns File path with posix separators.
 */
export function toPosixPath(filePath: string) {
  return filePath.replaceAll('\\', '/')
}

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
  } = path.parse(toPosixPath(imagePath))

  return path.format({
    dir,
    name: `${name}${postfix}`,
    ext: `.${format}`
  })
}

/**
 * Format the postfix for the variant.
 * @param postfix - Postfix string or formatter function.
 * @param width - Actual width of the variant in pixels.
 * @param requestedWidth - Width as it was requested.
 * @param format - Image variant format.
 * @returns Postfix string.
 */
export function formatPostfix(postfix: Postfix, width: number, requestedWidth: number, format: ImageFormat) {
  if (typeof postfix === 'string') {
    return postfix
  }

  return postfix(width, requestedWidth, format)
}

/**
 * Resolved widths and path of a variant to generate.
 */
export interface ResolvedVariant {
  /**
   * Width as it was requested, in pixels.
   */
  requestedWidth: number
  /**
   * Actual output width: pixels are never upscaled, so the requested
   * width is capped by the original width.
   */
  targetWidth: number
  /**
   * Postfix built from the actual output width.
   */
  postfix: string
  /**
   * Image variant file path.
   */
  path: string
}

/**
 * Resolve the variant widths and path from the generation inputs,
 * before generating. The SVG passthrough keeps the source path.
 * @param context - Generation inputs.
 * @param variant - Variant to generate, `null` for the SVG passthrough.
 * @returns Resolved variant.
 */
export function resolveVariant(context: GenerateContext, variant: ImageVariant | null): ResolvedVariant {
  const {
    source,
    metadata
  } = context

  if (!variant) {
    return {
      requestedWidth: metadata.width,
      targetWidth: metadata.width,
      postfix: '',
      path: toPosixPath(source.path)
    }
  }

  const {
    format,
    width
  } = variant
  const isMultiplier = width <= 1
  const requestedWidth = isMultiplier ? Math.ceil(width * metadata.width) : width
  const targetWidth = Math.min(requestedWidth, metadata.width)
  const postfix = formatPostfix(context.postfix, targetWidth, width, format)

  return {
    requestedWidth,
    targetWidth,
    postfix,
    path: renameImagePath(source.path, postfix, format)
  }
}
