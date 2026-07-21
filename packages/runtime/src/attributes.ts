import type { SrcSetEntry } from './types.ts'
import {
  filterBy,
  groupBy,
  toSrcSetString
} from './utils.ts'

function getTypePriority(type: string) {
  if (type === 'image/avif') {
    return 0
  }

  if (type === 'image/webp') {
    return 1
  }

  return 2
}

function compareSourceGroups(
  [typeA]: [string, SrcSetEntry[]],
  [typeB]: [string, SrcSetEntry[]]
) {
  return getTypePriority(typeA) - getTypePriority(typeB)
}

/**
 * Make props for `<source>` elements of a `<picture>`.
 * Groups are ordered by format efficiency (avif, webp, then the rest),
 * so a browser picks the best supported format first.
 * @param srcSet - Set of image variants.
 * @returns Props for `<source>` elements.
 */
export function getSourceProps(srcSet: SrcSetEntry[]) {
  return groupBy(srcSet, 'type')
    .sort(compareSourceGroups)
    .map(([type, group]) => ({
      type,
      srcSet: toSrcSetString(group)
    }))
}

export interface ImageSrcProps {
  src?: string
  srcSet?: string
}

/**
 * Make `src` and `srcSet` attribute values for the `<img>` element.
 * The `srcSet` string is built from the variants of the `src` format
 * and omitted when it duplicates the `src` url.
 * @param src - Image variant for the `src` attribute.
 * @param srcSet - Set of image variants or a ready `srcset` string.
 * @returns `src` and `srcSet` attribute values.
 */
export function getImageProps(src: SrcSetEntry | undefined, srcSet: SrcSetEntry[] | string | undefined): ImageSrcProps {
  if (typeof srcSet === 'string') {
    return src
      ? {
        src: src.url,
        srcSet
      }
      : {
        srcSet
      }
  }

  if (!src) {
    if (srcSet) {
      return {
        srcSet: toSrcSetString(srcSet)
      }
    }

    return {}
  }

  if (srcSet) {
    const srcSetString = toSrcSetString(filterBy(srcSet, 'format', src.format))

    if (srcSetString && srcSetString !== src.url) {
      return {
        src: src.url,
        srcSet: srcSetString
      }
    }
  }

  return {
    src: src.url
  }
}
