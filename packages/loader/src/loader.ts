/* oxlint-disable import/no-default-export */
import type { SrcSetImage } from '@srcset/core'
import {
  parseResourceQuery,
  generateSrcSetModule
} from '@srcset/bundler-utils'
import type {
  SrcSetLoaderCompiler,
  SrcSetLoaderContext
} from './types.ts'
import {
  interpolateName,
  getDefaultName
} from './template.ts'
import {
  resolveOutputPath,
  resolvePublicPath
} from './paths.ts'
import { getSharedLimit } from './limit.ts'
import { getSharedCache } from './cache.ts'

const tapped = new WeakSet<SrcSetLoaderCompiler>()

/**
 * Tap the end of the compilation once per compiler: the loader runs
 * for every module, so tapping on each run would pile up the handlers.
 * @param compiler - Compiler of the loader run.
 * @param handler - Handler to run when the compilation is done.
 */
function tapOnce(compiler: SrcSetLoaderCompiler, handler: () => Promise<void>) {
  if (tapped.has(compiler)) {
    return
  }

  tapped.add(compiler)
  compiler.hooks.done.tapPromise('srcset', handler)
}

async function generateModule(ctx: SrcSetLoaderContext, contents: Buffer) {
  const {
    context = ctx.rootContext,
    emitFile = true,
    name = getDefaultName(ctx.mode),
    cache = false,
    concurrency,
    outputPath,
    publicPath,
    ...moduleOptions
  } = ctx.getOptions()
  const source = {
    path: ctx.resourcePath,
    contents
  }
  const query = parseResourceQuery(ctx.resourceQuery)
  const limit = getSharedLimit(concurrency)
  const storage = cache ? getSharedCache(ctx.rootContext, cache) : undefined

  if (storage) {
    // Pruning before the build would drop the entries it is about to hit,
    // whose marks it has not refreshed yet.
    tapOnce(ctx._compiler, () => storage.prune())
  }

  const emitImage = (image: SrcSetImage) => {
    const url = interpolateName(name, {
      contents: image.contents,
      resourcePath: ctx.resourcePath,
      context,
      postfix: image.postfix,
      format: image.format
    })
    const imageOutputPath = resolveOutputPath(outputPath, url, ctx.resourcePath, context)
    const imagePublicPath = resolvePublicPath(publicPath, url, ctx.resourcePath, context)

    if (emitFile) {
      ctx.emitFile(imageOutputPath, image.contents)
    }

    return {
      outputPath: imageOutputPath,
      publicPath: imagePublicPath,
      publicPathExpression: '__webpack_public_path__'
    }
  }

  return generateSrcSetModule(
    source,
    query,
    {
      ...moduleOptions,
      cache: storage
    },
    emitImage,
    limit
  )
}

/**
 * Webpack and Rspack loader for generating responsive images.
 * @param contents - Source image contents.
 */
export default function srcSetLoader(this: SrcSetLoaderContext, contents: Buffer) {
  const callback = this.async()

  generateModule(this, contents).then(
    (module) => {
      callback(null, module)
    },
    (error: Error) => {
      callback(error)
    }
  )
}

export const raw = true
