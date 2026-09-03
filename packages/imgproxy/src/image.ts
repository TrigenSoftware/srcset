import {
  type SrcSetEntry,
  type ImageFormat,
  mimeTypes
} from '@srcset/runtime'
import type {
  ImgproxyOptions,
  ImgproxyRule,
  ImgproxySigner,
  ProcessingBuilder
} from './types.ts'
import {
  buildImgproxyUrl,
  createDefaultProcessing
} from './url.ts'
import { toArray } from './utils.ts'

const FORMAT_PATTERN = /\.(\w+)$/
const QUERY_OR_FRAGMENT_PATTERN = /[?#]/

/**
 * Get the image format from the url file extension.
 * @param url - Image url.
 * @returns Image format, `jpg` if unknown.
 */
function formatFromUrl(url: string) {
  // Only the path part: query and fragment can contain dotted values.
  const [pathname] = url.split(QUERY_OR_FRAGMENT_PATTERN, 1)
  const extension = FORMAT_PATTERN.exec(pathname)?.[1].toLowerCase()
  const format = extension === 'jpeg' ? 'jpg' : extension

  return format && Object.hasOwn(mimeTypes, format) ? format as ImageFormat : 'jpg'
}

/**
 * Get the default output format from the url file extension.
 * Svg is not an output format, so an svg source rasterizes to the fallback.
 * @param url - Image url.
 * @returns Image format, `jpg` if not an output format.
 */
function outputFormatFromUrl(url: string) {
  const format = formatFromUrl(url)

  return format === 'svg' ? 'jpg' : format
}

export interface ImgproxyImage {
  /**
   * Url of the `src` variant.
   */
  url: string
  /**
   * Fallback image variant: the source format, or the first format
   * of the rule when the source format is not in it, at the largest width.
   */
  src: SrcSetEntry
  /**
   * Generated image variants.
   */
  srcSet: SrcSetEntry[]
  /**
   * Id-to-url map of generated image variants.
   */
  srcMap: Record<string, string>
}

/**
 * Builder of loader-shaped srcset objects for content images,
 * e.g. from an API or a CMS, with imgproxy urls.
 */
export class Imgproxy {
  readonly #endpoint: string
  readonly #signer: ImgproxySigner | undefined
  readonly #processing: ProcessingBuilder
  readonly #passthrough: boolean

  constructor(options: ImgproxyOptions) {
    const {
      endpoint,
      signer,
      quality,
      processing = createDefaultProcessing(quality),
      passthrough = false
    } = options

    this.#endpoint = endpoint
    this.#signer = signer
    this.#processing = processing
    this.#passthrough = passthrough
  }

  /**
   * Build a loader-shaped srcset object for the image.
   * The source size is unknown on the client, so the rule
   * needs absolute widths, and the variants have no height.
   * In the passthrough mode the object carries the untouched
   * source url with empty variants.
   * @param sourceUrl - Public url of the original image.
   * @param rule - Rule to compute variants.
   * @returns Image srcset object.
   */
  image(sourceUrl: string, rule: ImgproxyRule): ImgproxyImage {
    const sourceFormat = outputFormatFromUrl(sourceUrl)
    // Raster image can't be converted to SVG.
    const formats = [...new Set(toArray(rule.format, sourceFormat))].filter(format => format !== 'svg')
    // Same selection as a build-time rule: the source format, or the first
    // format of the list when the source format is not in it.
    const srcFormat = formats.includes(sourceFormat) ? sourceFormat : formats[0]
    const widths = toArray(rule.width)
    const srcSet: SrcSetEntry[] = []
    const srcMap: Record<string, string> = {}
    let src: SrcSetEntry | undefined

    for (const format of formats) {
      for (const width of new Set(widths)) {
        // The source size is unknown on the client, so multipliers can't be
        // resolved, and `w` descriptors need integer pixel widths.
        if (!Number.isInteger(width) || width <= 1) {
          throw new TypeError('The imgproxy image builder needs absolute integer widths in the rule.')
        }

        const entry: SrcSetEntry = {
          id: `${format}${width}`,
          format,
          type: mimeTypes[format],
          width,
          url: this.#passthrough
            ? sourceUrl
            : buildImgproxyUrl(this.#endpoint, this.#processing({
              format,
              width
            }), sourceUrl, this.#signer)
        }

        if (!this.#passthrough) {
          srcSet.push(entry)
          srcMap[entry.id] = entry.url
        }

        // The `src` variant is the largest width of the selected format.
        if (entry.format === srcFormat && (!src || entry.width > src.width)) {
          src = entry
        }
      }
    }

    if (!src) {
      throw new TypeError('No image variants: set the `width` and a non-svg `format` in the rule.')
    }

    // The passthrough image is the untouched original, so there are no variants to pick from.
    if (this.#passthrough) {
      const format = formatFromUrl(sourceUrl)

      return {
        url: sourceUrl,
        src: {
          id: `${format}${src.width}`,
          format,
          type: mimeTypes[format],
          width: src.width,
          url: sourceUrl
        },
        srcSet,
        srcMap
      }
    }

    return {
      url: src.url,
      src,
      srcSet,
      srcMap
    }
  }
}
