import type { LimitFunction } from 'p-limit'
import type {
  ImageMetadata,
  ImageSource,
  SrcSetImage,
  SrcSetGeneratorOptions
} from '@srcset/core'
import type {
  SrcSetRule,
  SrcSetImagePaths,
  SrcSetBackendImage
} from './types.ts'
import type {
  SrcSetEntrySelect,
  ResourceIdFormatter
} from './module.types.ts'
import type { PlaceholderOptions } from './placeholder.ts'

/**
 * Common options of a srcset bundler integration.
 */
export interface SrcSetModuleOptions extends Omit<SrcSetGeneratorOptions, 'limit'> {
  /**
   * Backend factory to produce image variants: the backend emits images
   * with `emitImage` and yields their urls. Defaults to the sharp generator backend.
   */
  backend?: SrcSetBackendFactory
  /**
   * Rules to generate image variants. An import query rule takes precedence.
   */
  rules?: SrcSetRule[]
  /**
   * Add `placeholder` module export - a tiny variant inlined as a data-url,
   * for blur-up placeholders. Unused export is tree-shaken away.
   */
  placeholder?: boolean | PlaceholderOptions
  /**
   * Resource id formatter function.
   */
  resourceId?: ResourceIdFormatter
  /**
   * Selection of the image variant for the default export. Import query takes precedence.
   */
  select?: SrcSetEntrySelect
}

/**
 * Backend of a srcset bundler integration: produces image variants.
 */
export interface SrcSetBackend {
  /**
   * Produce images for the rule.
   * @param source - Image file.
   * @param metadata - Image metadata.
   * @param rule - Rule to generate images.
   * @returns Images.
   */
  generate(
    source: ImageSource,
    metadata: ImageMetadata,
    rule: SrcSetRule
  ): AsyncIterable<SrcSetBackendImage> | Iterable<SrcSetBackendImage>
}

/**
 * Factory of a backend: creates the backend instance from the integration
 * options, the image emitter and the shared concurrency limit.
 * @param options - Integration options.
 * @param emitImage - Emits an image on the bundler side.
 * @param limit - Concurrency limit of the integration.
 * @returns Backend.
 */
export type SrcSetBackendFactory = (
  options: Omit<SrcSetGeneratorOptions, 'limit'>,
  emitImage: EmitImage,
  limit?: LimitFunction
) => SrcSetBackend

/**
 * Emits an image on the bundler side.
 * @param image - Image variant.
 * @returns Paths of the emitted image.
 */
export type EmitImage = (image: SrcSetImage) => SrcSetImagePaths
