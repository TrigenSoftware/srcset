import {
  mkdir,
  readFile,
  writeFile
} from 'node:fs/promises'
import {
  dirname,
  join,
  relative,
  basename,
  resolve
} from 'node:path'
import { availableParallelism } from 'node:os'
import {
  SrcSetGenerator,
  matchImage
} from '@srcset/core'
import pLimit from 'p-limit'
import { glob } from 'tinyglobby'
import type { SrcSetCliOptions } from './types.ts'

function toOutputPath(dest: string, path: string) {
  const relativePath = relative(process.cwd(), path)

  return join(dest, relativePath.startsWith('..') ? basename(path) : relativePath)
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
  // Bound the number of source files processed at once, not just the variant encoding.
  const limit = pLimit(generatorOptions.concurrency ?? availableParallelism())
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

  await Promise.all(files.map(file => limit(() => processFile(file))))

  return written
}
