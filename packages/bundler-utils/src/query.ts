import type { SrcSetRule } from './types.ts'
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
 * @param resourceQuery - Resource query string starting with `?`.
 * @returns Parsed options.
 */
export function parseResourceQuery(resourceQuery: string): QueryOptions {
  const query: QueryOptions = {}

  if (!resourceQuery.startsWith('?')) {
    return query
  }

  for (const pair of resourceQuery.slice(1).split('&')) {
    if (pair.startsWith('{')) {
      query.rules = [JSON.parse(pair) as SrcSetRule]
      continue
    }

    const [key, value] = pair.split('=')

    switch (key) {
      case 'id':
        query.select = {
          ...query.select,
          id: value
        }
        break

      case 'format':
        query.select = {
          ...query.select,
          format: value
        }
        break

      case 'width':
        query.select = {
          ...query.select,
          width: Number(value)
        }
        break

      case 'placeholder':
        query.placeholder = value !== 'false'
        break

      default:
    }
  }

  return query
}
