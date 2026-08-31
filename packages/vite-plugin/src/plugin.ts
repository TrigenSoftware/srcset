import { availableParallelism } from 'node:os'
import {
  access,
  readFile
} from 'node:fs/promises'
import {
  basename,
  join
} from 'node:path'
import {
  type SrcSetImage,
  SrcSetCacheStorage
} from '@srcset/core'
import pLimit from 'p-limit'
import {
  type Plugin,
  createFilter
} from 'vite'
import {
  type SrcSetModuleOptions,
  parseResourceQuery,
  generateSrcSetModule
} from '@srcset/bundler-utils'
import type { SrcSetVitePluginOptions } from './types.ts'
import {
  splitId,
  createLoadFilter
} from './query.ts'
import {
  createDevMiddleware,
  getDevPath
} from './dev.ts'

interface EmitContext {
  emitFile(file: {
    type: 'asset'
    name: string
    source: Buffer
  }): string
}

async function fileExists(path: string) {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

/**
 * Vite plugin for generating responsive images.
 * Handles image imports by default: `import url, { src, srcSet, srcMap } from './image.jpg'`.
 * Imports with a foreign query, like `?url` or `?raw`, stay in the Vite asset pipeline.
 * @param options - Plugin options.
 * @returns Vite plugin.
 */
export function srcset(options: SrcSetVitePluginOptions = {}): Plugin {
  const {
    concurrency = availableParallelism(),
    cache = true,
    include,
    exclude
  } = options
  const limit = pLimit(concurrency)
  const cacheOptions = typeof cache === 'object' ? cache : {}
  const loadFilter = createLoadFilter(include, exclude)
  // Fallback for environments without hook filters, built from the same filter.
  const matchesLoadFilter = createFilter(loadFilter.id.include, loadFilter.id.exclude)
  let moduleOptions: SrcSetModuleOptions
  let devUrlBase = '/'
  let publicDir = ''
  let isBuild = false
  const generateModule = async (context: EmitContext, path: string, rawQuery: string) => {
    const source = {
      path,
      contents: await readFile(path)
    }
    const query = parseResourceQuery(rawQuery)
    const emitImage = (image: SrcSetImage) => {
      if (isBuild) {
        const name = basename(image.path)
        const referenceId = context.emitFile({
          type: 'asset',
          name,
          source: image.contents
        })

        return {
          outputPath: name,
          // Vite replaces the placeholder with the final asset url, respecting `base`.
          publicPath: `__VITE_ASSET__${referenceId}__`
        }
      }

      // The variant file is already stored: the storage
      // memoizes the generation before the emit.
      const devPath = getDevPath(image)

      return {
        outputPath: devPath,
        publicPath: devUrlBase + devPath
      }
    }

    return generateSrcSetModule(
      source,
      query,
      moduleOptions,
      emitImage,
      limit
    )
  }

  return {
    name: 'srcset',
    enforce: 'pre',
    configResolved(config) {
      // Vite includes the origin in the dev asset urls for backend integrations.
      devUrlBase = (config.server.origin ?? '') + config.base
      publicDir = config.publicDir
      isBuild = config.command === 'build'
      // The dev server always uses the storage: variants are served from it.
      moduleOptions = {
        ...options,
        cache: !isBuild || cache
          ? new SrcSetCacheStorage({
            ...cacheOptions,
            dir: cacheOptions.dir ?? join(config.cacheDir, 'srcset')
          })
          : undefined
      }
    },
    // Pruning before the build would drop the entries it is about to hit,
    // whose marks it has not refreshed yet.
    async closeBundle() {
      await moduleOptions.cache?.prune()
    },
    configureServer(server) {
      if (moduleOptions.cache) {
        server.middlewares.use(createDevMiddleware(
          moduleOptions.cache,
          server.config.base
        ))
      }
    },
    load: {
      filter: loadFilter,
      async handler(id) {
        if (!matchesLoadFilter(id)) {
          return null
        }

        const {
          path,
          query
        } = splitId(id)

        // Root-absolute imports of `publicDir` assets stay in the Vite asset pipeline.
        if (publicDir && !await fileExists(path) && await fileExists(join(publicDir, path))) {
          return null
        }

        return generateModule(this, path, query)
      }
    }
  }
}
