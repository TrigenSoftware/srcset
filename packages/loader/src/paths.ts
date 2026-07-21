import path from 'node:path'
import type { PathResolver } from './types.ts'

/**
 * Resolve output path for the emitted file.
 * @param outputPath - Output path option.
 * @param url - Image variant url.
 * @param resourcePath - Source image file path.
 * @param context - Context directory path.
 * @returns Output path.
 */
export function resolveOutputPath(
  outputPath: string | PathResolver | undefined,
  url: string,
  resourcePath: string,
  context: string
) {
  if (!outputPath) {
    return url
  }

  if (typeof outputPath === 'function') {
    return outputPath(url, resourcePath, context)
  }

  return path.posix.join(outputPath, url)
}

/**
 * Resolve public path for the url.
 * @param publicPath - Public path option.
 * @param url - Image variant url.
 * @param resourcePath - Source image file path.
 * @param context - Context directory path.
 * @returns Public path, or `null` to use the compiler public path.
 */
export function resolvePublicPath(
  publicPath: string | PathResolver | undefined,
  url: string,
  resourcePath: string,
  context: string
) {
  if (!publicPath) {
    return null
  }

  if (typeof publicPath === 'function') {
    return publicPath(url, resourcePath, context)
  }

  return `${publicPath}${publicPath.endsWith('/') ? '' : '/'}${url}`
}
