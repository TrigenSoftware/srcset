import type { ImageFormat } from '@srcset/core'
import type { SrcSetBackendImage } from './types.ts'

/**
 * Resource id formatter function.
 * @param width - Actual width of the image variant in pixels.
 * @param requestedWidth - Multiplier when the variant was requested with one, otherwise the actual width.
 * @param format - Image variant format.
 * @returns Resource id.
 */
export type ResourceIdFormatter = (width: number, requestedWidth: number, format: ImageFormat) => string

/**
 * Generated image variant entry of the module: the backend image plus
 * the resource id and the mime type. Serialized to the runtime
 * `SrcSetEntry` shape in the module code.
 */
export interface SrcSetModuleEntry extends SrcSetBackendImage {
  /**
   * Resource id of the variant.
   */
  id: string
  /**
   * Image mime type.
   */
  type: string
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
