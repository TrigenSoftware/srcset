import process from 'node:process'
import type { SrcSetCliOptions } from './types.ts'
import {
  usage,
  parseCliArgs
} from './args.ts'
import { loadConfig } from './config.ts'
import { run } from './run.ts'

try {
  const args = parseCliArgs()

  if (args.help) {
    console.info(usage)
    process.exit(0)
  }

  const config = await loadConfig(args.config)
  const options: SrcSetCliOptions = {
    ...config,
    src: args.sources.length ? args.sources : config.src ?? [],
    dest: args.dest ?? config.dest ?? '',
    rules: args.rule ? [args.rule] : config.rules,
    ...args.verbose !== undefined && {
      verbose: args.verbose
    },
    ...args.skipOptimization !== undefined && {
      skipOptimization: args.skipOptimization
    },
    ...args.scalingUp !== undefined && {
      scalingUp: args.scalingUp
    },
    ...args.concurrency !== undefined && {
      concurrency: args.concurrency
    }
  }

  if (!options.src.length) {
    throw new Error('No source images: pass glob patterns or set `src` in the config.')
  }

  if (!options.dest) {
    throw new Error('No destination directory: pass `--dest` or set `dest` in the config.')
  }

  await run(options)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
