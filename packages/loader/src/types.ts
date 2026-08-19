import type { SrcSetModuleOptions } from '@srcset/bundler-utils'

/**
 * Path resolver function.
 * @param url - Image variant url.
 * @param resourcePath - Source image file path.
 * @param context - Context directory path.
 * @returns Resolved path.
 */
export type PathResolver = (url: string, resourcePath: string, context: string) => string

/**
 * The part of the webpack and rspack loader context the loader uses.
 * Declared structurally: both compilers satisfy it, and the published
 * types stay usable without `webpack` installed - it is an optional peer.
 */
export interface SrcSetLoaderContext {
  /**
   * Absolute path of the source image file.
   */
  resourcePath: string
  /**
   * Import query string of the source image, with the leading `?`.
   */
  resourceQuery: string
  /**
   * Root context directory of the compiler.
   */
  rootContext: string
  /**
   * Compiler mode.
   */
  mode: string | undefined
  /**
   * Read the loader options.
   * @returns Loader options.
   */
  getOptions(): SrcSetLoaderOptions
  /**
   * Emit a file to the build output.
   * @param name - Output file path.
   * @param content - File contents.
   */
  emitFile(name: string, content: string | Buffer): void
  /**
   * Switch the loader to the asynchronous mode.
   * @returns Completion callback.
   */
  async(): (error?: Error | null, content?: string | Buffer) => void
}

export interface SrcSetLoaderOptions extends Omit<SrcSetModuleOptions, 'cache'> {
  /**
   * Cache generated variants on disk, in `node_modules/.cache/srcset`:
   * repeated builds skip the generation. Disabled by default - the
   * persistent cache of the bundler covers it, when it is enabled.
   */
  cache?: boolean
  /**
   * Output file name template.
   * Supports `[name]`, `[postfix]`, `[ext]`, `[path]`, `[sourceext]` and
   * `[hash]`/`[contenthash]` (with optional `:length`) tokens. `[sourceext]`
   * is the source file extension, empty when the output format matches it.
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
