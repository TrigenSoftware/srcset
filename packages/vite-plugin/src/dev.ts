import type {
  IncomingMessage,
  ServerResponse
} from 'node:http'
import type { ReadStream } from 'node:fs'
import {
  basename,
  extname
} from 'node:path'
import {
  type SrcSetCacheStorage,
  type SrcSetImage,
  getStoredPath,
  mimeTypes
} from '@srcset/core'

export const devPathPrefix = '/@srcset/'

// Relative form: emitted paths stay relative, public urls are prefixed with the base.
const relativeDevPathPrefix = devPathPrefix.slice(1)

/**
 * Make the dev server path of the variant, without the leading slash:
 * the manifest key addresses the stored file, the variant name keeps
 * the url readable. The name is encoded: browsers percent-encode special
 * characters in requests, the middleware matches the decoded form.
 * @param image - Image variant, memoized in the cache storage.
 * @returns Dev server path of the variant.
 */
export function getDevPath(image: SrcSetImage) {
  if (!image.cacheKey) {
    throw new Error(`Image variant "${image.path}" is not stored in the cache storage.`)
  }

  return `${relativeDevPathPrefix}${image.cacheKey}/${encodeURIComponent(basename(image.path))}`
}

/**
 * Create a dev server middleware streaming the generated variants
 * from the cache storage.
 * @param storage - Cache storage of the generated variants.
 * @param base - Base public path of the served urls.
 * @returns Connect-style middleware.
 */
export function createDevMiddleware(storage: SrcSetCacheStorage, base = '/') {
  const prefix = base + relativeDevPathPrefix

  return (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    let storedPath: string

    // The prefix is matched on the pathname only: a prefix inside
    // a query string of a foreign route is not ours. Url parsing also
    // normalizes dot segments, so traversals fail the prefix check.
    try {
      const { pathname } = new URL(request.url ?? '', 'http://localhost')

      if (!pathname.startsWith(prefix)) {
        next()
        return
      }

      // The address is `<manifest key>/<variant name>`: the name alone
      // is not unique across sources and options.
      const [key, name, ...rest] = pathname.slice(prefix.length).split('/')

      if (!key || !name || rest.length) {
        next()
        return
      }

      storedPath = getStoredPath(key, decodeURIComponent(name))
    } catch {
      // Invalid url or malformed percent-encoding: not ours.
      next()
      return
    }

    const format = extname(storedPath).slice(1) as keyof typeof mimeTypes

    // The middleware serves plain variant files only.
    if (!Object.hasOwn(mimeTypes, format)) {
      next()
      return
    }

    let stream: ReadStream

    try {
      stream = storage.readStream(storedPath)
    } catch {
      // The storage rejects unsafe paths: not ours to serve.
      next()
      return
    }

    stream.on('error', () => {
      // The storage was cleaned under a running server.
      response.statusCode = 404
      response.end()
    })
    // A client leaving mid-response would otherwise leak the file descriptor
    // for the lifetime of the dev server.
    response.on('close', () => {
      stream.destroy()
    })
    response.setHeader('Content-Type', mimeTypes[format])
    response.setHeader('Cache-Control', 'no-cache')
    stream.pipe(response)
  }
}
