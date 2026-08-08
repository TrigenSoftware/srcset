import type { ImageFormat } from '@srcset/core'
import type { SrcSetImagePaths } from './types.ts'

/**
 * Resource id formatter function.
 * @param width - Actual width of the image variant in pixels.
 * @param requestedWidth - Multiplier when the variant was requested with one, otherwise the actual width.
 * @param format - Image variant format.
 * @returns Resource id.
 */
export type ResourceIdFormatter = (width: number, requestedWidth: number, format: ImageFormat) => string

/**
 * Generated image variant entry of the module: the emitted image paths
 * plus the variant properties. Serialized to the runtime
 * `SrcSetEntry` shape in the module code.
 */
export interface SrcSetModuleEntry {
  /**
   * Resource id of the variant.
   */
  id: string
  /**
   * Image format.
   */
  format: ImageFormat
  /**
   * Image mime type.
   */
  type: string
  /**
   * Image width in pixels.
   */
  width: number
  /**
   * Image height in pixels.
   */
  height: number
  /**
   * Width multiplier relative to the original image, if the variant was requested with one.
   */
  originMultiplier: number | null
  /**
   * Paths of the image variant emitted with `EmitImage`.
   */
  url: SrcSetImagePaths
}

/**
 * Selection of the image variant for the default export.
 */
export interface SrcSetEntrySelect {
  /**
   * Resource id of the variant.
   */
  id?: string
  /**
   * Format of the variant.
   */
  format?: string
  /**
   * Width of the variant: absolute value or multiplier less than or equal to 1.
   */
  width?: number
}
