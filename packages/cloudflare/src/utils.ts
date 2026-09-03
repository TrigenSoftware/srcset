/**
 * Normalize an optional single-or-array value to an array of unique values.
 * @param value - Single value, array, or `undefined`.
 * @param fallback - Value for the `undefined` case, omitted for an empty array.
 * @returns Array of unique values.
 */
export function toUniqArray<T>(value: T | T[] | undefined, fallback?: T): T[] {
  if (Array.isArray(value)) {
    return [...new Set(value)]
  }

  if (value !== undefined) {
    return [value]
  }

  return fallback === undefined ? [] : [fallback]
}
