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
  resolve
} from 'node:path'
import {
  SrcSetGenerator,
  matchImage
} from '@srcset/core'
import { glob } from 'tinyglobby'
import type { SrcSetCliOptions } from './types.ts'

function toOutputPath(dest: string, path: string) {
  const relativePath = relative(process.cwd(), path)

  return join(dest, relativePath.startsWith('..') || isAbsolute(relativePath) ? basename(path) : relativePath)
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
  const processFile = async (file: string) => {
    const source = {
      path: resolve(file),
      contents: await readFile(file)
    }

    for (const rule of rules) {
      if (!await matchImage(source, rule.match)) {
        continue
      }

      for await (const image of generator.generate(source, rule)) {
        const outputPath = toOutputPath(dest, image.path)

        await mkdir(dirname(outputPath), {
          recursive: true
        })
        await writeFile(outputPath, image.contents)
        written.push(outputPath)

        if (verbose) {
          console.info(`${file} -> ${outputPath}`)
        }
      }

      if (rule.only) {
        break
      }
    }
  }

  // Sequential on purpose: the variant processing of a single file is parallel already.
  for (const file of files) {
    await processFile(file)
  }

  return written
}
