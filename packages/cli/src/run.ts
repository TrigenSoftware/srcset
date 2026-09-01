import {
  mkdir,
  readFile,
  writeFile
} from 'node:fs/promises'
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from 'node:path'
import {
  type SrcSetImage,
  SrcSetGenerator,
  getImageMetadata
} from '@srcset/core'
import { generateSrcSetModule } from '@srcset/bundler-utils'
import { glob } from 'tinyglobby'
import type {
  SrcSetCliOptions,
  SrcSetModuleFormat
} from './types.ts'
import {
  toIdentifier,
  withImports
} from './module.ts'

const outsidePattern = new RegExp(`^\\.\\.(?:\\${sep}|$)`)

function toOutputPath(dest: string, path: string) {
  const relativePath = relative(process.cwd(), path)

  return join(dest, outsidePattern.test(relativePath) || isAbsolute(relativePath) ? basename(path) : relativePath)
}

/**
 * Make the directory of the baked files: the `-dir` formats put an image
 * and its module into a folder named after the source.
 * @param dest - Destination directory.
 * @param sourcePath - Source image file path.
 * @param format - Module format.
 * @returns Directory to write the image files into.
 */
function toModuleDir(dest: string, sourcePath: string, format: SrcSetModuleFormat) {
  const outputPath = toOutputPath(dest, sourcePath)

  return format.endsWith('-dir')
    ? join(dirname(outputPath), basename(outputPath, extname(outputPath)))
    : dirname(outputPath)
}

/**
 * Make the path of the generated module: next to the variants under the
 * source name, or `index` in the folder of the `-dir` formats.
 * @param dir - Directory of the baked files.
 * @param sourcePath - Source image file path.
 * @param format - Module format.
 * @returns Module file path.
 */
function toModulePath(dir: string, sourcePath: string, format: SrcSetModuleFormat) {
  const extension = format.startsWith('ts') ? '.ts' : '.js'
  const name = format.endsWith('-dir') ? 'index' : basename(sourcePath, extname(sourcePath))

  return join(dir, `${name}${extension}`)
}

/**
 * Generate image variants for the matched source images
 * and write them to the destination directory.
 * @param options - Sources, destination, rules and generator options.
 * @returns Written file paths.
 */
export async function run(options: SrcSetCliOptions) {
  const {
    src,
    dest,
    module: moduleFormat,
    verbose,
    // Both are cut from the cli options, but a config file is javascript:
    // dropping them here keeps a stray one out of the generator.
    cache,
    limit,
    ...generateOptions
  } = options
  const { rules = [{}] } = generateOptions
  const files = await glob(src)

  if (!files.length) {
    throw new Error('No source images found.')
  }

  const written: string[] = []
  const outputPaths = new Set<string>()
  // Sources outside the cwd keep their file name only, so two of them
  // can resolve to one output path - losing a file without a word
  // is worse than stopping.
  const write = async (outputPath: string, contents: Buffer | string, from: string) => {
    if (outputPaths.has(outputPath)) {
      throw new Error(`Output path collision: "${outputPath}". Run from a directory containing every source, or process them separately.`)
    }

    outputPaths.add(outputPath)
    await mkdir(dirname(outputPath), {
      recursive: true
    })
    await writeFile(outputPath, contents)
    written.push(outputPath)

    if (verbose) {
      console.info(`${from} -> ${outputPath}`)
    }
  }
  const readSource = async (file: string) => {
    const source = {
      path: resolve(file),
      contents: await readFile(file)
    }

    // Rule matching reads an image it cannot decode as a miss, so without
    // this the cli would silently skip a source it was pointed at.
    try {
      await getImageMetadata(source)
    } catch (error) {
      throw new Error(`Cannot read image "${file}": ${error instanceof Error ? error.message : String(error)}`, {
        cause: error
      })
    }

    return source
  }
  const writeVariants = async (file: string, generator: SrcSetGenerator) => {
    const source = await readSource(file)

    for await (const image of generator.generateAll(source, rules)) {
      await write(toOutputPath(dest, image.path), image.contents, file)
    }
  }
  // Baking writes the variants too: the module imports them as plain assets.
  const bakeModule = async (file: string, format: SrcSetModuleFormat) => {
    const source = await readSource(file)
    const identifiers = new Set<string>()
    const imports: [string, string][] = []
    const images: SrcSetImage[] = []
    const emitImage = (image: SrcSetImage) => {
      const name = basename(image.path)
      const identifier = toIdentifier(name, identifiers)

      images.push(image)
      imports.push([identifier, name])

      return {
        outputPath: name,
        publicPath: null,
        urlExpression: identifier
      }
    }
    const body = await generateSrcSetModule(source, {}, {
      ...generateOptions,
      typescript: format.startsWith('ts')
    }, emitImage)

    // An image no rule matched has no variants to import: the plain mode
    // writes nothing for it, and a module exporting nothing is no better.
    if (!images.length) {
      return
    }

    const dir = toModuleDir(dest, source.path, format)

    for (const image of images) {
      await write(join(dir, basename(image.path)), image.contents, file)
    }

    await write(toModulePath(dir, source.path, format), withImports(imports, body), file)
  }

  // Sequential on purpose: the variant processing of a single file is parallel already.
  if (moduleFormat) {
    for (const file of files) {
      await bakeModule(file, moduleFormat)
    }
  } else {
    const generator = new SrcSetGenerator(generateOptions)

    for (const file of files) {
      await writeVariants(file, generator)
    }
  }

  return written
}
