import { match as matchMediaQuery } from 'css-mediaquery'
import picomatch from 'picomatch'
import type { ImageSource } from './types.ts'
import { getImageMetadata } from './metadata.ts'

/**
 * Image size in pixels.
 */
export interface ImageSize {
  width: number
  height: number
}

/**
 * Matcher function.
 * @param path - Image file path.
 * @param size - Image size in pixels.
 * @param source - Image file.
 * @returns Image is matched or not.
 */
export type MatcherFunction = (path: string, size: ImageSize, source: ImageSource) => boolean

/**
 * There is support of 3 types of matchers:
 * 1. Glob pattern of file path;
 * 2. Media query to match image by size;
 * 3. Matcher function.
 */
export type Matcher = string | MatcherFunction

// Size feature query, like `(min-width: 100px)`: parenthesized globs, e.g. extglobs, are not media queries.
const mediaQueryPattern = /\(\s*((?:min-|max-)?(?:width|height))\s*(?::\s*([^\s)]+))?\s*\)/

/**
 * Match image file by path and size.
 * @param source - Image file.
 * @param matcher - Rule(s) to match image file. Nullish matches any supported image.
 * @returns Image is matched or not.
 */
export async function matchImage(source: ImageSource, matcher?: Matcher | Matcher[] | null) {
  let size: ImageSize

  try {
    const {
      width,
      height
    } = await getImageMetadata(source)

    size = {
      width,
      height
    }
  } catch {
    return false
  }

  if (matcher === null || matcher === undefined) {
    return true
  }

  const matchers = Array.isArray(matcher) ? matcher : [matcher]

  return matchers.every((matcherToApply) => {
    if (typeof matcherToApply === 'string') {
      if (mediaQueryPattern.test(matcherToApply)) {
        return matchMediaQuery(matcherToApply, size)
      }

      return picomatch(matcherToApply)(source.path)
    }

    if (typeof matcherToApply === 'function') {
      return matcherToApply(source.path, size, source)
    }

    return false
  })
}
