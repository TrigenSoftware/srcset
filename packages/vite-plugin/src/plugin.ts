import { availableParallelism } from 'node:os'
import { readFile } from 'node:fs/promises'
import type { SrcSetImage } from '@srcset/core'
import pLimit from 'p-limit'
import {
  type Plugin,
  createFilter
} from 'vite'
import {
  parseResourceQuery,
  generateSrcSetModule
} from '@srcset/bundler-utils'
import type { SrcSetVitePluginOptions } from './types.ts'
import {
  splitId,
  getResourceQuery,
  createLoadFilter
} from './query.ts'
import {
  type DevCache,
  addDevImage,
  createDevMiddleware
} from './dev.ts'

interface EmitContext {
  emitFile(file: {
    type: 'asset'
    name: string
    source: Buffer
  }): string
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
    include,
    exclude
  } = options
  const limit = pLimit(concurrency)
  const loadFilter = createLoadFilter(include, exclude)
  // Fallback for environments without hook filters, built from the same filter.
  const matchesLoadFilter = createFilter(loadFilter.id.include, loadFilter.id.exclude)
  const devCache: DevCache = new Map()
  let base = '/'
  let isBuild = false
  const generateModule = async (context: EmitContext, id: string) => {
    const { path } = splitId(id)
    const source = {
      path,
      contents: await readFile(path)
    }
    const query = parseResourceQuery(getResourceQuery(id))
    const emitImage = (image: SrcSetImage) => {
      if (isBuild) {
        const name = image.path.slice(image.path.lastIndexOf('/') + 1)
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

      const devPath = addDevImage(devCache, image).slice(1)

      return {
        outputPath: devPath,
        publicPath: base + devPath
      }
    }

    return generateSrcSetModule(
      source,
      query,
      options,
      emitImage,
      limit
    )
  }

  return {
    name: 'srcset',
    enforce: 'pre',
    configResolved(config) {
      base = config.base
      isBuild = config.command === 'build'
    },
    configureServer(server) {
      server.middlewares.use(createDevMiddleware(devCache))
    },
    load: {
      filter: loadFilter,
      handler(id) {
        if (!matchesLoadFilter(id)) {
          return null
        }

        return generateModule(this, id)
      }
    }
  }
}
