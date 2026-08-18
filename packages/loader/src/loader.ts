/* oxlint-disable import/no-default-export */
import type { SrcSetImage } from '@srcset/core'
import {
  parseResourceQuery,
  generateSrcSetModule
} from '@srcset/bundler-utils'
import type { SrcSetLoaderContext } from './types.ts'
import {
  interpolateName,
  getDefaultName
} from './template.ts'
import {
  resolveOutputPath,
  resolvePublicPath
} from './paths.ts'
import { getSharedLimit } from './limit.ts'

async function generateModule(ctx: SrcSetLoaderContext, contents: Buffer) {
  const options = ctx.getOptions()
  const {
    context = ctx.rootContext,
    emitFile = true,
    name = getDefaultName(ctx.mode),
    concurrency,
    outputPath,
    publicPath
  } = options
  const source = {
    path: ctx.resourcePath,
    contents
  }
  const query = parseResourceQuery(ctx.resourceQuery)
  const limit = getSharedLimit(concurrency)
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
    options,
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
