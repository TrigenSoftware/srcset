import type { SrcSetRule } from '@srcset/core'
import type { SrcSetEntrySelect } from './module.ts'

export interface QueryOptions {
  rules?: SrcSetRule[]
  select?: SrcSetEntrySelect
  placeholder?: boolean
}

/**
 * Parse srcset options from the import query.
 * Supported parts, combined with `&`:
 * - `{ "width": [1, 0.5], "format": ["webp", "jpg"] }` - JSON rule to generate variants;
 * - `id=<id>`, `format=<format>`, `width=<width>` - selection of the variant for the default export;
 * - `placeholder` - add the `placeholder` module export.
 * @param resourceQuery - Resource query string, with or without the leading `?`.
 * @returns Parsed options.
 */
export function parseResourceQuery(resourceQuery: string): QueryOptions {
  const query: QueryOptions = {}
  const pairs = resourceQuery.startsWith('?') ? resourceQuery.slice(1) : resourceQuery

  if (!pairs) {
    return query
  }

  for (const pair of pairs.split('&')) {
    if (pair.startsWith('{')) {
      try {
        query.rules = [JSON.parse(pair) as SrcSetRule]
      } catch {
        throw new Error(`Invalid srcset rule in the import query: "${pair}"`)
      }

      continue
    }

    const [key, value] = pair.split('=')

    switch (key) {
      case 'id':
        if (value) {
          query.select = {
            ...query.select,
            id: value
          }
        }

        break

      case 'format':
        if (value) {
          query.select = {
            ...query.select,
            format: value
          }
        }

        break

      case 'width': {
        const width = Number(value)

        if (width > 0) {
          query.select = {
            ...query.select,
            width
          }
        }

        break
      }

      case 'placeholder':
        query.placeholder = value !== 'false'
        break

      default:
    }
  }

  return query
}
