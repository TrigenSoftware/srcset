import type {
  ProcessingOptions,
  PostfixFormatter
} from './types.ts'

type ProcessingFormat = keyof ProcessingOptions

/**
 * Merge processing options per format, so overriding one sharp option
 * doesn't drop the rest, e.g. `jpg: { quality: 80 }` keeps default `jpg: { mozjpeg: true }`.
 * @param base - Base processing options.
 * @param override - Processing options to apply on top.
 * @returns Merged processing options.
 */
export function mergeProcessingOptions(base: ProcessingOptions, override: ProcessingOptions | undefined) {
  const result: ProcessingOptions = {
    ...base
  }

  if (override) {
    for (const format of Object.keys(override) as ProcessingFormat[]) {
      result[format] = {
        ...result[format],
        ...override[format]
      }
    }
  }

  return result
}

/**
 * Default sharp output options.
 *
 * Chosen empirically by SSIM and file size:
 * - `mozjpeg` gives ~30% smaller jpg files at the same quality;
 * - `palette` enables lossy quantization for png (like `pngquant`);
 * - webp and avif sharp defaults are good as is.
 */
export const defaultProcessing: ProcessingOptions = {
  jpg: {
    mozjpeg: true
  },
  png: {
    palette: true
  }
}

/**
 * Default postfix formatter: `@<width>w` for every variant except the original-size multiplier.
 * @param width - Calculated width of the image variant.
 * @param multiplier - Requested width: absolute value or multiplier.
 * @returns Postfix string.
 */
export const defaultPostfix: PostfixFormatter = (width, multiplier) => (
  multiplier === 1 ? '' : `@${width}w`
)
