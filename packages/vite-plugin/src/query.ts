import type { FilterPattern } from 'vite'

// Image extensions with the import query allowed: filters match the full module id.
const imageIdPattern = /\.(?:jpe?g|png|webp|avif|gif)(?:\?|$)/i
// oxlint-disable-next-line eslint/no-control-regex
const virtualIdPattern = /^\u0000/
// Native Vite queries leave the import to the Vite asset pipeline.
const viteQueryPattern = /[?&](?:url|raw|inline|no-inline|worker|sharedworker|init)(?:=|&|$)/
const nodeModulesPattern = /\/node_modules\//

function toArray<T>(value: T | readonly T[]): T[] {
  return Array.isArray(value) ? [...value] : [value as T]
}

/**
 * Create the `load` hook filter from the plugin options: Vite evaluates it
 * natively (in rolldown) and skips calling the JS handler for non-matching
 * module ids entirely. The handler applies the same filter with `createFilter`
 * as a fallback for environments without hook filters.
 * @param include - Ids to process, defaults to all image imports.
 * @param exclude - Ids to skip, defaults to `node_modules`. String patterns are globs matching absolute ids.
 * @returns Declarative hook filter.
 */
export function createLoadFilter(include?: FilterPattern, exclude?: FilterPattern) {
  return {
    id: {
      include: include ? toArray(include) : [imageIdPattern],
      exclude: [
        virtualIdPattern,
        viteQueryPattern,
        ...exclude ? toArray(exclude) : [nodeModulesPattern]
      ]
    }
  }
}

/**
 * Split a Vite module id into the file path and the query string.
 * @param id - Module id.
 * @returns File path and query string without `?`.
 */
export function splitId(id: string) {
  const index = id.indexOf('?')

  if (index < 0) {
    return {
      path: id,
      query: ''
    }
  }

  return {
    path: id.slice(0, index),
    query: id.slice(index + 1)
  }
}

/**
 * Get the module id query for parsing. The id arrives already decoded:
 * Vite decodes request urls before the plugins.
 * @param id - Module id.
 * @returns Query string starting with `?`.
 */
export function getResourceQuery(id: string) {
  return `?${splitId(id).query}`
}
