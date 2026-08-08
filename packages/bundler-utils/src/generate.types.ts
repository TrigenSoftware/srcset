import type {
  SrcSetImage,
  SrcSetGeneratorOptions
} from '@srcset/core'
import type {
  SrcSetRule,
  SrcSetImagePaths
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
 * Emits an image on the bundler side.
 * @param image - Image variant.
 * @returns Paths of the emitted image.
 */
export type EmitImage = (image: SrcSetImage) => SrcSetImagePaths
