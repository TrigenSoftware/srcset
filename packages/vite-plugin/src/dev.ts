import type {
  IncomingMessage,
  ServerResponse
} from 'node:http'
import { createHash } from 'node:crypto'
import {
  type SrcSetImage,
  mimeTypes
} from '@srcset/core'

export const devPathPrefix = '/@srcset/'

const hashLength = 8

interface DevImage {
  contents: Buffer
  type: string
}

/**
 * In-memory cache of the generated variants for the dev server middleware.
 */
export type DevCache = Map<string, DevImage>

/**
 * Add an image variant to the dev cache.
 * @param cache - Dev cache.
 * @param image - Image variant.
 * @returns Dev server pathname of the variant.
 */
export function addDevImage(cache: DevCache, image: SrcSetImage) {
  const hash = createHash('sha256').update(image.contents).digest('hex').slice(0, hashLength)
  const extensionIndex = image.path.lastIndexOf('.')
  const stem = image.path.slice(image.path.lastIndexOf('/') + 1, extensionIndex)
  const pathname = `${devPathPrefix}${stem}.${hash}.${image.format}`

  cache.set(pathname, {
    contents: image.contents,
    type: mimeTypes[image.format]
  })

  return pathname
}

/**
 * Create a dev server middleware serving the generated variants from the cache.
 * @param cache - Dev cache.
 * @returns Connect-style middleware.
 */
export function createDevMiddleware(cache: DevCache) {
  return (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const url = request.url ?? ''
    const index = url.indexOf(devPathPrefix)
    const image = index < 0 ? undefined : cache.get(url.slice(index))

    if (!image) {
      next()
      return
    }

    response.setHeader('Content-Type', image.type)
    response.setHeader('Cache-Control', 'no-cache')
    response.end(image.contents)
  }
}
