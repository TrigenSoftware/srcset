import {
  type SrcSetEntry,
  type ImageFormat,
  mimeTypes
} from '@srcset/runtime'
import type {
  CloudflareOptions,
  CloudflareRule,
  ProcessingBuilder
} from './types.ts'
import {
  DEFAULT_ENDPOINT,
  canOutputFormat,
  buildCloudflareUrl,
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

export interface CloudflareImage {
  /**
   * Url of the `src` variant.
   */
  url: string
  /**
   * Fallback image variant: the last format, the largest width.
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
 * e.g. from an API or a CMS, with Cloudflare image transformations urls.
 */
export class Cloudflare {
  readonly #endpoint: string
  readonly #processing: ProcessingBuilder
  readonly #passthrough: boolean

  constructor(options: CloudflareOptions = {}) {
    const {
      endpoint = DEFAULT_ENDPOINT,
      quality,
      processing = createDefaultProcessing(quality),
      passthrough = false
    } = options

    this.#endpoint = endpoint
    this.#processing = processing
    this.#passthrough = passthrough
  }

  /**
   * Build a loader-shaped srcset object for the image.
   * The source size is unknown on the client, so the rule
   * needs absolute widths, and the variants have no height.
   * In the passthrough mode the object carries the untouched
   * source url with empty variants. An svg source always passes
   * through: Cloudflare returns svg as is.
   * @param sourceUrl - Public url of the original image.
   * @param rule - Rule to compute variants.
   * @returns Image srcset object.
   */
  image(sourceUrl: string, rule: CloudflareRule): CloudflareImage {
    const sourceFormat = formatFromUrl(sourceUrl)
    const isSvgSource = sourceFormat === 'svg'
    // Cloudflare returns svg sources as is, ignoring all transformations,
    // so an svg source always passes through; jpg drives the variant loop.
    const passthrough = this.#passthrough || isSvgSource
    const formats: ImageFormat[] = isSvgSource ? ['jpg'] : toArray(rule.format, sourceFormat)
    const widths = toArray(rule.width)
    const srcSet: SrcSetEntry[] = []
    const srcMap: Record<string, string> = {}
    let src: SrcSetEntry | undefined

    for (const format of new Set(formats)) {
      if (!canOutputFormat(format, sourceFormat)) {
        throw new TypeError(`Cloudflare can not force the ${format} output format.`)
      }

      for (const width of new Set(widths)) {
        // The source size is unknown on the client, so multipliers can't be
        // resolved, and `w` descriptors need integer pixel widths.
        if (!Number.isInteger(width) || width <= 1) {
          throw new TypeError('The Cloudflare image builder needs absolute integer widths in the rule.')
        }

        const entry: SrcSetEntry = {
          id: `${format}${width}`,
          format,
          type: mimeTypes[format],
          width,
          url: passthrough
            ? sourceUrl
            : buildCloudflareUrl(this.#endpoint, this.#processing({
              format,
              width
            }), sourceUrl)
        }

        if (!passthrough) {
          srcSet.push(entry)
          srcMap[entry.id] = entry.url
        }

        // Formats go first: on format change the entry starts the next format
        // group, so the src candidate ends up in the last group, the largest width.
        if (!src || src.format !== entry.format || entry.width > src.width) {
          src = entry
        }
      }
    }

    if (!src) {
      throw new TypeError('No image variants: set the `width` and a non-svg `format` in the rule.')
    }

    // The passthrough image is the untouched original, so there are no variants to pick from.
    if (passthrough) {
      return {
        url: sourceUrl,
        src: {
          id: `${sourceFormat}${src.width}`,
          format: sourceFormat,
          type: mimeTypes[sourceFormat],
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
