import {
  mkdir,
  readFile,
  writeFile
} from 'node:fs/promises'
import {
  dirname,
  isAbsolute,
  join,
  relative,
  basename,
  resolve,
  sep
} from 'node:path'
import { SrcSetGenerator } from '@srcset/core'
import { glob } from 'tinyglobby'
import type { SrcSetCliOptions } from './types.ts'

const outsidePattern = new RegExp(`^\\.\\.(?:\\${sep}|$)`)

function toOutputPath(dest: string, path: string) {
  const relativePath = relative(process.cwd(), path)

  return join(dest, outsidePattern.test(relativePath) || isAbsolute(relativePath) ? basename(path) : relativePath)
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
    rules = [{}],
    verbose,
    ...generatorOptions
  } = options
  const files = await glob(src)

  if (!files.length) {
    throw new Error('No source images found.')
  }

  const generator = new SrcSetGenerator(generatorOptions)
  const written: string[] = []
  const outputPaths = new Set<string>()
  const processFile = async (file: string) => {
    const source = {
      path: resolve(file),
      contents: await readFile(file)
    }

    for await (const image of generator.generateAll(source, rules)) {
      const outputPath = toOutputPath(dest, image.path)

      // Sources outside the cwd keep their file name only, so two of them
      // can resolve to one output path - losing an image without a word
      // is worse than stopping.
      if (outputPaths.has(outputPath)) {
        throw new Error(`Output path collision: "${outputPath}". Run from a directory containing every source, or process them separately.`)
      }

      outputPaths.add(outputPath)
      await mkdir(dirname(outputPath), {
        recursive: true
      })
      await writeFile(outputPath, image.contents)
      written.push(outputPath)

      if (verbose) {
        console.info(`${file} -> ${outputPath}`)
      }
    }
  }

  // Sequential on purpose: the variant processing of a single file is parallel already.
  for (const file of files) {
    await processFile(file)
  }

  return written
}
