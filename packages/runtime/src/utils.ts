import type { SrcSetEntry } from './types.ts'

/**
 * Group image variants by field.
 * @param srcSet - Set of image variants.
 * @param field - Field name to group by.
 * @returns Group entries in the original order.
 */
export function groupBy<K extends keyof SrcSetEntry>(srcSet: SrcSetEntry[], field: K) {
  const groups = new Map<SrcSetEntry[K], SrcSetEntry[]>()

  for (const src of srcSet) {
    const value = src[field]
    const group = groups.get(value)

    if (group) {
      group.push(src)
    } else {
      groups.set(value, [src])
    }
  }

  return [...groups.entries()]
}

/**
 * Filter image variants by field value.
 * @param srcSet - Set of image variants.
 * @param field - Field name to filter by.
 * @param value - Field value to filter by.
 * @returns Filtered set of image variants.
 */
export function filterBy<K extends keyof SrcSetEntry>(srcSet: SrcSetEntry[], field: K, value: SrcSetEntry[K]) {
  return srcSet.filter(src => src[field] === value)
}

/**
 * Make `srcset` attribute string.
 * @param srcSet - Set of image variants.
 * @returns `srcset` attribute string.
 */
export function toSrcSetString(srcSet: SrcSetEntry[]) {
  if (srcSet.length > 1) {
    return srcSet.map(({
      url,
      width
    }) => `${url} ${width}w`).join(', ')
  }

  return srcSet.length ? srcSet[0].url : ''
}

const maxDensityPrecision = 100

/**
 * Make `srcset` attribute string with pixel density descriptors.
 * Densities are computed from the variant widths relative to the smallest one.
 * Suits images of a fixed display size, where width descriptors would require `sizes`.
 * @param srcSet - Set of image variants, usually of a single format.
 * @returns `srcset` attribute string.
 */
export function toDensitySrcSetString(srcSet: SrcSetEntry[]) {
  if (srcSet.length > 1) {
    const minWidth = Math.min(...srcSet.map(({ width }) => width))

    return srcSet.map(({
      url,
      width
    }) => `${url} ${Math.round(width / minWidth * maxDensityPrecision) / maxDensityPrecision}x`).join(', ')
  }

  return srcSet.length ? srcSet[0].url : ''
}
