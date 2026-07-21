import type { SrcSetModuleOptions } from '@srcset/bundler-utils'

/**
 * Path resolver function.
 * @param url - Image variant url.
 * @param resourcePath - Source image file path.
 * @param context - Context directory path.
 * @returns Resolved path.
 */
export type PathResolver = (url: string, resourcePath: string, context: string) => string

export interface SrcSetLoaderOptions extends SrcSetModuleOptions {
  /**
   * Output file name template.
   * Supports `[name]`, `[postfix]`, `[ext]`, `[path]` and `[hash]`/`[contenthash]` (with optional `:length`) tokens.
   */
  name?: string
  /**
   * Context directory path. Defaults to the compiler root context.
   */
  context?: string
  /**
   * Directory or resolver function for emitted files.
   */
  outputPath?: string | PathResolver
  /**
   * Public path or resolver function for urls. Defaults to the compiler public path.
   */
  publicPath?: string | PathResolver
  /**
   * Emit generated files. Disable e.g. for SSR builds.
   */
  emitFile?: boolean
}
