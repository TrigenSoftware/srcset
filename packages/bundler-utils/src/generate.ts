import type { LimitFunction } from 'p-limit'
import {
  type ImageSource,
  SrcSetGenerator,
  getImageMetadata,
  matchImage,
  mimeTypes
} from '@srcset/core'
import type { QueryOptions } from './query.ts'
import type {
  SrcSetModuleOptions,
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
 * @param options - Bundler integration options.
 * @param emitImage - Emits an image on the bundler side.
 * @param limit - Concurrency limit of the integration.
 * @returns Module code.
 */
export async function generateSrcSetModule(
  source: ImageSource,
  query: QueryOptions,
  options: SrcSetModuleOptions,
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
  const placeholder = await createPlaceholder(
    source,
    metadata,
    query.placeholder ?? options.placeholder,
    limit,
    options.cache
  )
  const select = {
    format: metadata.format,
    width: metadata.width,
    ...options.select,
    ...query.select
  }
  const srcSet: SrcSetModuleEntry[] = []

  for (const rule of rules) {
    if (!await matchImage(source, rule.match)) {
      continue
    }

    for await (const image of generator.generate(source, rule)) {
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

    if (!rule.fallthrough) {
      break
    }
  }

  return createModuleString(select, srcSet, placeholder)
}
