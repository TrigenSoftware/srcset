import type { SrcSetImagePaths } from './types.ts'
import type {
  SrcSetModuleEntry,
  SrcSetEntrySelect,
  ResourceIdFormatter
} from './module.types.ts'

export type * from './module.types.ts'

/**
 * Default resource id formatter: format plus actual width, e.g. `jpg640`.
 * @param width - Actual width of the image variant in pixels.
 * @param requestedWidth - Width as it was requested.
 * @param format - Image variant format.
 * @returns Resource id.
 */
export const defaultResourceId: ResourceIdFormatter = (width, _requestedWidth, format) => `${format}${String(width)}`

const emptyUrlExpression = "''"

/**
 * Make a JS expression for the image variant url: plain urls are encoded,
 * emitted images without a plain public url are prefixed with the
 * public path expression of the integration, like `__webpack_public_path__`.
 * @param url - Plain url string, or the emitted image paths.
 * @returns JS expression string.
 */
function toUrlExpression(url: string | SrcSetImagePaths) {
  if (typeof url === 'string') {
    return JSON.stringify(url)
  }

  if (url.publicPath !== null) {
    return JSON.stringify(url.publicPath)
  }

  const outputPath = JSON.stringify(url.outputPath)

  return url.publicPathExpression ? `(${url.publicPathExpression}) + ${outputPath}` : outputPath
}

function findDefaultIndex(select: SrcSetEntrySelect, srcSet: SrcSetModuleEntry[]) {
  const index = srcSet.findIndex((entry) => {
    if (entry.id === select.id) {
      return true
    }

    // An undefined select field is a wildcard, an empty select falls back to the first variant.
    if (select.format === undefined && select.width === undefined) {
      return false
    }

    if (select.format !== undefined && entry.format !== select.format) {
      return false
    }

    if (select.width === undefined) {
      return true
    }

    if (select.width <= 1) {
      return entry.originMultiplier === select.width
    }

    return entry.width === select.width
  })

  if (index < 0 && srcSet.length) {
    return 0
  }

  return index
}

function createEntryString({
  id,
  format,
  type,
  width,
  height
}: SrcSetModuleEntry, urlString: string) {
  return `{
  id: ${JSON.stringify(id)},
  format: ${JSON.stringify(format)},
  type: ${JSON.stringify(type)},
  width: ${String(width)},
  height: ${String(height)},
  url: ${urlString}
}`
}

/**
 * Create ES module code for the image import.
 * @param select - Selection of the image variant for the default export.
 * @param srcSet - Generated image variant entries.
 * @param placeholder - Data-url of the placeholder variant, falsy to emit `undefined`.
 * @returns Module code.
 */
export function createModuleString(select: SrcSetEntrySelect, srcSet: SrcSetModuleEntry[], placeholder?: string | false) {
  const defaultIndex = findDefaultIndex(select, srcSet)
  const urlExpressions = srcSet.map(entry => toUrlExpression(entry.url))
  const urlExpression = defaultIndex < 0 ? emptyUrlExpression : urlExpressions[defaultIndex]
  const srcSetStrings: string[] = []
  const srcMapStrings: string[] = []
  let srcString = 'null'

  srcSet.forEach((entry, index) => {
    const isDefault = index === defaultIndex
    const urlString = isDefault ? 'url' : urlExpressions[index]
    const entryString = createEntryString(entry, urlString)

    if (isDefault) {
      srcString = entryString
    }

    srcMapStrings.push(`${JSON.stringify(entry.id)}: ${urlString}`)
    srcSetStrings.push(isDefault ? 'src' : entryString)
  })

  return `const url = ${urlExpression};
const src = ${srcString};

export default url;
export { src };
export const srcSet = [${srcSetStrings.join(', ')}];
export const srcMap = {
  ${srcMapStrings.join(',\n  ')}
};
export const placeholder = ${placeholder ? JSON.stringify(placeholder) : 'undefined'};
`
}
