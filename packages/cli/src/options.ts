import type { CliArgs } from './args.ts'
import type {
  SrcSetCliOptions,
  SrcSetModuleFormat
} from './types.ts'

const moduleFormats = new Set<SrcSetModuleFormat>(['ts', 'js', 'ts-dir', 'js-dir'])

/**
 * Read the module format option: the cli argument and the config file
 * value go through the same check.
 * @param value - Option value.
 * @returns Module format, or `undefined` when the option is not set.
 */
export function toModuleFormat(value: string | undefined) {
  if (value === undefined) {
    return undefined
  }

  if (!moduleFormats.has(value as SrcSetModuleFormat)) {
    throw new Error(`Unknown module format: "${value}". Use ts, js, ts-dir or js-dir.`)
  }

  return value as SrcSetModuleFormat
}

/**
 * Merge the command line arguments into the config file options:
 * an argument wins, an option it does not carry falls back to the config.
 * @param args - Parsed command line arguments.
 * @param config - Config file options.
 * @returns Options of the run.
 */
export function toCliOptions(args: CliArgs, config: Partial<SrcSetCliOptions>): SrcSetCliOptions {
  const options: SrcSetCliOptions = {
    ...config,
    src: args.sources.length ? args.sources : config.src ?? [],
    dest: args.dest ?? config.dest ?? '',
    rules: args.rule ? [args.rule] : config.rules,
    module: toModuleFormat(args.module ?? config.module),
    verbose: args.verbose ?? config.verbose,
    skipOptimization: args.skipOptimization ?? config.skipOptimization,
    scalingUp: args.scalingUp ?? config.scalingUp,
    concurrency: args.concurrency ?? config.concurrency
  }

  if (!options.src.length) {
    throw new Error('No source images: pass glob patterns or set `src` in the config.')
  }

  if (!options.dest) {
    throw new Error('No destination directory: pass `--dest` or set `dest` in the config.')
  }

  return options
}
