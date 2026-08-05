import { availableParallelism } from 'node:os'
import type { LimitFunction } from 'p-limit'
import type { Sharp } from 'sharp'
import pLimit from 'p-limit'
import sharp from 'sharp'
import type { ImageFormat } from './formats.ts'
import type { SrcSetCacheStorage } from './cache.ts'
import type {
  ImageSource,
  ImageVariant,
  SrcSetImage,
  ProcessingOptions,
  OptimizationOptions,
  Postfix,
  SrcSetGeneratorOptions,
  GenerateOptions,
  GenerateContext
} from './types.ts'
import {
  isSupportedFormat,
  normalizeFormat
} from './formats.ts'
import {
  defaultProcessing,
  defaultPostfix,
  mergeProcessingOptions
} from './defaults.ts'
import { getImageMetadata } from './metadata.ts'
import { resolveVariant } from './path.ts'
import { parallel } from './parallel.ts'

const animatableFormats = new Set<ImageFormat>(['gif', 'webp'])

function createVariants(formats: ImageFormat[], widths: number[]) {
  const uniqueFormats = new Set(formats)
  const uniqueWidths = new Set(widths)
  const variants: ImageVariant[] = []

  for (const format of uniqueFormats) {
    for (const width of uniqueWidths) {
      variants.push({
        format,
        width
      })
    }
  }

  return variants
}

function validateWidths(widths: number[]) {
  widths.forEach((width) => {
    if (
      typeof width !== 'number'
      || !Number.isFinite(width)
      || width <= 0
      || (width > 1 && !Number.isInteger(width))
    ) {
      throw new Error(`Invalid width: ${String(width)}`)
    }
  })
}

function applyFormat(pipeline: Sharp, format: Exclude<ImageFormat, 'svg'>, processing: ProcessingOptions) {
  switch (format) {
    case 'avif':
      pipeline.avif(processing.avif)
      break

    case 'webp':
      pipeline.webp(processing.webp)
      break

    case 'jpg':
      pipeline.jpeg(processing.jpg)
      break

    case 'png':
      pipeline.png(processing.png)
      break

    case 'gif':
      pipeline.gif(processing.gif)
      break
  }
}

/**
 * Generator of image variants: resized, converted and optimized.
 */
export class SrcSetGenerator {
  private readonly processing: ProcessingOptions
  private readonly optimization: OptimizationOptions
  private readonly skipOptimization: boolean
  private readonly scalingUp: boolean
  private readonly postfix: Postfix
  private readonly limit: LimitFunction
  private readonly cache?: SrcSetCacheStorage

  constructor(options: SrcSetGeneratorOptions = {}) {
    this.processing = mergeProcessingOptions(defaultProcessing, options.processing)
    this.optimization = {
      ...options.optimization
    }
    this.skipOptimization = options.skipOptimization ?? false
    this.scalingUp = options.scalingUp ?? true
    this.postfix = options.postfix ?? defaultPostfix
    this.limit = options.limit ?? pLimit(options.concurrency ?? availableParallelism())
    this.cache = options.cache
  }

  /**
   * Create set of image variants from the source image.
   * @param source - Image file.
   * @param options - Image handle options.
   * @yields Generated image variants.
   */
  async* generate(
    source: ImageSource,
    options: GenerateOptions = {}
  ): AsyncGenerator<SrcSetImage, void> {
    if (typeof source.path !== 'string' || !Buffer.isBuffer(source.contents)) {
      throw new TypeError('Invalid source: path string and contents buffer are required.')
    }

    const metadata = await getImageMetadata(source)
    const {
      format = [],
      width = [],
      postfix = this.postfix,
      processing,
      optimization,
      skipOptimization = this.skipOptimization,
      scalingUp = this.scalingUp
    } = options
    const formats = (Array.isArray(format) ? format : [format]).map((formatToNormalize) => {
      const normalizedFormat = normalizeFormat(formatToNormalize)

      if (!isSupportedFormat(normalizedFormat)) {
        throw new Error(`Unsupported image format: "${formatToNormalize}"`)
      }

      return normalizedFormat
    })
    const widths = Array.isArray(width) ? [...width] : [width]

    validateWidths(widths)

    if (!formats.length) {
      formats.push(metadata.format)
    }

    if (!widths.length) {
      widths.push(1)
    }

    const context: GenerateContext = {
      source,
      metadata,
      processing: mergeProcessingOptions(this.processing, processing),
      optimization: {
        ...this.optimization,
        ...optimization
      },
      postfix,
      skipOptimization,
      scalingUp
    }

    if (metadata.format === 'svg') {
      if (formats.includes('svg')) {
        yield await this.memo(context, null, () => this.processSvg(context))
      }

      return
    }

    const variants = createVariants(formats, widths)

    yield* parallel(
      variants,
      variant => this.memo(context, variant, () => this.processVariant(context, variant)),
      this.limit
    )
  }

  /**
   * Memoize the variant generation in the cache storage, when configured.
   * @param context - Generate context.
   * @param variant - Variant to generate, `null` for the SVG passthrough.
   * @param fn - Variant generator function.
   * @returns Generated image variant, or `null` if the variant is skipped.
   */
  private async memo<T extends SrcSetImage | null>(
    context: GenerateContext,
    variant: ImageVariant | null,
    fn: () => Promise<T>
  ): Promise<T | SrcSetImage> {
    return this.cache ? this.cache.memo(context, variant, fn) : fn()
  }

  /**
   * Pass SVG image through, optionally applying a custom optimizer.
   * @param context - Generate context.
   * @returns Image variant.
   */
  private async processSvg(context: GenerateContext): Promise<SrcSetImage> {
    const {
      source,
      metadata
    } = context
    const contents = await this.optimizeImage(source.contents, 'svg', context)

    return {
      path: source.path,
      contents,
      format: 'svg',
      width: metadata.width,
      height: metadata.height,
      postfix: '',
      originMultiplier: null
    }
  }

  /**
   * Resize, convert and optimize the image variant.
   * @param context - Generate context.
   * @param variant - Format and width of the variant.
   * @returns Image variant, or `null` if the variant should be skipped.
   */
  private async processVariant(
    context: GenerateContext,
    variant: ImageVariant
  ): Promise<SrcSetImage | null> {
    const {
      format,
      width
    } = variant

    // Raster image can't be converted to SVG.
    if (format === 'svg') {
      return null
    }

    const {
      source,
      metadata
    } = context
    const isMultiplier = width <= 1
    const {
      requestedWidth,
      targetWidth,
      postfix,
      path
    } = resolveVariant(context, variant)

    if (!context.scalingUp && requestedWidth > metadata.width) {
      return null
    }

    const willResize = targetWidth < metadata.width
    const passthrough = !willResize && format === metadata.format && context.skipOptimization
    let contents: Buffer
    let outputWidth = metadata.width
    let outputHeight = metadata.height

    if (passthrough) {
      contents = source.contents
    } else {
      const animated = metadata.animated && animatableFormats.has(format)
      const pipeline = sharp(source.contents, {
        animated
      })

      if (willResize) {
        pipeline.resize(targetWidth)
      }

      applyFormat(pipeline, format, context.processing)

      const {
        data,
        info
      } = await pipeline.toBuffer({
        resolveWithObject: true
      })

      contents = data
      outputWidth = info.width
      outputHeight = info.pageHeight ?? info.height
    }

    contents = await this.optimizeImage(contents, format, context)

    return {
      path,
      contents,
      format,
      width: outputWidth,
      height: outputHeight,
      postfix,
      originMultiplier: isMultiplier ? width : null
    }
  }

  /**
   * Apply a custom optimizer to the encoded image contents.
   * @param contents - Encoded image contents.
   * @param format - Image variant format.
   * @param context - Generate context.
   * @returns Optimized image contents.
   */
  private async optimizeImage(
    contents: Buffer,
    format: ImageFormat,
    context: GenerateContext
  ) {
    const optimize = context.optimization[format]

    if (context.skipOptimization || !optimize) {
      return contents
    }

    return optimize(contents, format)
  }
}
