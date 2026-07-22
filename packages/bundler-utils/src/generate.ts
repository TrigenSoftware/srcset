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
  SrcSetBackendFactory,
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
 * The default backend factory: generates images with the sharp
 * generator and emits them on the bundler side.
 * @param options - Generator options.
 * @param emitImage - Emits an image on the bundler side.
 * @param limit - Concurrency limit of the integration.
 * @returns Backend.
 */
export const srcsetBackend: SrcSetBackendFactory = (options, emitImage, limit) => {
  const generator = new SrcSetGenerator({
    ...options,
    limit
  })

  return {
    async* generate(source, _metadata, rule) {
      for await (const image of generator.generate(source, rule)) {
        yield {
          format: image.format,
          width: image.width,
          height: image.height,
          originMultiplier: image.originMultiplier,
          url: emitImage(image)
        }
      }
    }
  }
}

/**
 * Generate ES module code for the image import: match the rules,
 * collect the images from the backend and make the module code.
 * @param source - Image file.
 * @param query - Parsed import query options.
 * @param options - Bundler integration options.
 * @param emitImage - Emits an image on the bundler side, passed to the backend.
 * @param limit - Concurrency limit of the integration, passed to the backend.
 * @returns Module code.
 */
export async function generateSrcSetModule(
  source: ImageSource,
  query: QueryOptions,
  options: SrcSetModuleOptions,
  emitImage: EmitImage,
  limit?: LimitFunction
) {
  const {
    backend: backendFactory = srcsetBackend,
    resourceId = defaultResourceId
  } = options
  const rules = query.rules ?? options.rules ?? [{}]
  const backend = backendFactory(options, emitImage, limit)
  const metadata = await getImageMetadata(source)
  const placeholder = await createPlaceholder(source, query.placeholder ?? options.placeholder, limit)
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

    for await (const image of backend.generate(source, metadata, rule)) {
      srcSet.push({
        ...image,
        id: resourceId(image.width, image.originMultiplier ?? image.width, image.format),
        type: mimeTypes[image.format]
      })
    }

    if (!rule.fallthrough) {
      break
    }
  }

  return createModuleString(select, srcSet, placeholder)
}
