import type { LimitFunction } from 'p-limit'
import {
  type ImageSource,
  SrcSetGenerator,
  getImageMetadata,
  mimeTypes
} from '@srcset/core'
import type { QueryOptions } from './query.ts'
import type {
  SrcSetModuleGenerateOptions,
  EmitImage
} from './generate.types.ts'
import {
  type SrcSetModuleEntry,
  createModuleString,
  defaultResourceId
} from './module.ts'
import { createPlaceholder } from './placeholder.ts'

export type * from './generate.types.ts'

/**
 * Generate ES module code for the image import: match the rules,
 * generate the image variants with the sharp generator, emit them
 * on the bundler side and make the module code.
 * @param source - Image file.
 * @param query - Parsed import query options.
 * @param options - Options of the module generation.
 * @param emitImage - Emits an image on the bundler side.
 * @param limit - Concurrency limit of the integration.
 * @returns Module code.
 */
export async function generateSrcSetModule(
  source: ImageSource,
  query: QueryOptions,
  options: SrcSetModuleGenerateOptions,
  emitImage: EmitImage,
  limit?: LimitFunction
) {
  const { resourceId = defaultResourceId } = options
  const rules = query.rules ?? options.rules ?? [{}]
  const generator = new SrcSetGenerator({
    ...options,
    limit
  })
  const metadata = await getImageMetadata(source)
  // The query flag only switches the placeholder on and off: the configured
  // options stay, so `?placeholder` does not fall back to the defaults.
  const placeholderOptions = query.placeholder === undefined
    ? options.placeholder
    : query.placeholder && (options.placeholder ?? true)
  const placeholder = await createPlaceholder(
    source,
    metadata,
    placeholderOptions,
    limit,
    options.cache
  )
  const userSelect = {
    ...options.select,
    ...query.select
  }
  const hasUserSelect = userSelect.id !== undefined
    || userSelect.format !== undefined
    || userSelect.width !== undefined
  // The implicit selection describes the original image and applies only when
  // nothing is selected explicitly: mixed into a partial selection it would
  // defeat the half the user did not specify.
  const select = hasUserSelect
    ? userSelect
    : {
      format: metadata.format,
      width: metadata.width
    }
  const srcSet: SrcSetModuleEntry[] = []

  for await (const image of generator.generateAll(source, rules)) {
    srcSet.push({
      id: resourceId(image.width, image.originMultiplier ?? image.width, image.format),
      format: image.format,
      type: mimeTypes[image.format],
      width: image.width,
      height: image.height,
      originMultiplier: image.originMultiplier,
      url: emitImage(image)
    })
  }

  return createModuleString({
    select,
    srcSet,
    placeholder,
    typescript: options.typescript
  })
}
