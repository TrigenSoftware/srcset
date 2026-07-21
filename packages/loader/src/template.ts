import { createHash } from 'node:crypto'
import {
  isAbsolute,
  parse,
  relative,
  sep
} from 'node:path'

export interface TemplateContext {
  /**
   * Image variant contents.
   */
  contents: Buffer
  /**
   * Source image file path.
   */
  resourcePath: string
  /**
   * Context directory path.
   */
  context: string
  /**
   * Image variant postfix.
   */
  postfix: string
  /**
   * Image variant format.
   */
  format: string
}

export const defaultProductionName = '[name][postfix].[contenthash:8].[ext]'
export const defaultDevelopmentName = '[path][name][postfix].[ext]'

/**
 * Get default output file name template for the compilation mode.
 * Development template skips the content hash: readable and stable names,
 * cache busting is not needed there. Uniqueness comes from the `[path]` prefix.
 * @param mode - Compilation mode.
 * @returns File name template.
 */
export function getDefaultName(mode: string | undefined) {
  return mode === 'development' ? defaultDevelopmentName : defaultProductionName
}

const defaultHashLength = 8
const hashPattern = /\[(?:content)?hash(?::(\d+))?\]/g

/**
 * Interpolate output file name template.
 * @param template - File name template with `[name]`, `[postfix]`, `[ext]`, `[path]`, `[hash]`/`[contenthash]` tokens.
 * @param context - Template context.
 * @returns Interpolated file name.
 */
export function interpolateName(template: string, context: TemplateContext) {
  const {
    dir,
    name
  } = parse(context.resourcePath)
  const relativeDir = relative(context.context, dir)
  // Resources outside the context get no path prefix: no parent
  // traversals or windows cross-drive paths in emitted names.
  const dirPath = relativeDir && !relativeDir.startsWith('..') && !isAbsolute(relativeDir)
    ? `${relativeDir.replaceAll(sep, '/')}/`
    : ''
  let hash: string | null = null

  return template
    .replaceAll('[path]', dirPath)
    .replaceAll('[name]', name)
    .replaceAll('[postfix]', context.postfix)
    .replaceAll('[ext]', context.format)
    .replace(hashPattern, (_, length: string | undefined) => {
      hash ??= createHash('sha256').update(context.contents).digest('hex')

      return hash.slice(0, length ? Number(length) : defaultHashLength)
    })
}
