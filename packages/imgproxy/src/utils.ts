/**
 * Normalize an optional single-or-array value to an array.
 * @param value - Single value, array, or `undefined`.
 * @param fallback - Value for the `undefined` case, omitted for an empty array.
 * @returns Array of values.
 */
export function toArray<T>(value: T | T[] | undefined, fallback?: T): T[] {
  if (Array.isArray(value)) {
    return value
  }

  if (value !== undefined) {
    return [value]
  }

  return fallback === undefined ? [] : [fallback]
}
