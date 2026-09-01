import type {
  PlaceholderOptions,
  SrcSetEntrySelect
} from '@srcset/bundler-utils'
import type { CliArgs } from './args.ts'
import type {
  SrcSetCliOptions,
  SrcSetModuleFormat
} from './types.ts'

const moduleFormats = new Set<SrcSetModuleFormat>(['ts', 'js', 'ts-dir', 'js-dir'])
const placeholderFormats = new Set<PlaceholderOptions['format']>(['webp', 'jpg'])

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
 * Read the placeholder options: a width or a format switches the placeholder
 * on by itself, there is nothing else they could mean.
 * @param args - Parsed command line arguments.
 * @returns Placeholder options, or `undefined` when no option is set.
 */
function toPlaceholder(args: CliArgs) {
  const {
    placeholder,
    placeholderWidth: width,
    placeholderFormat
  } = args

  if (placeholderFormat !== undefined && !placeholderFormats.has(placeholderFormat as PlaceholderOptions['format'])) {
    throw new Error(`Unknown placeholder format: "${placeholderFormat}". Use webp or jpg.`)
  }

  const format = placeholderFormat as PlaceholderOptions['format']

  if (width === undefined && format === undefined) {
    return placeholder
  }

  // An explicit `--no-placeholder` wins over the options of the same run.
  return placeholder === false
    ? false
    : {
      ...width !== undefined && {
        width
      },
      ...format !== undefined && {
        format
      }
    }
}

/**
 * Read the selection of the variant for the default export of the module.
 * @param args - Parsed command line arguments.
 * @returns Selection, or `undefined` when no option is set.
 */
function toSelect(args: CliArgs) {
  const {
    selectId: id,
    selectFormat: format,
    selectWidth: width
  } = args

  if (id === undefined && format === undefined && width === undefined) {
    return undefined
  }

  const select: SrcSetEntrySelect = {
    ...id !== undefined && {
      id
    },
    ...format !== undefined && {
      format
    },
    ...width !== undefined && {
      width
    }
  }

  return select
}

/**
 * Merge the command line arguments into the config file options:
 * an argument wins, an option it does not carry falls back to the config.
 * @param args - Parsed command line arguments.
 * @param config - Config file options.
 * @returns Options of the run.
 */
export function toCliOptions(args: CliArgs, config: Partial<SrcSetCliOptions>): SrcSetCliOptions {
  const placeholder = toPlaceholder(args)
  const select = toSelect(args)
  const options: SrcSetCliOptions = {
    ...config,
    src: args.sources.length ? args.sources : config.src ?? [],
    dest: args.dest ?? config.dest ?? '',
    rules: args.rule ? [args.rule] : config.rules,
    module: toModuleFormat(args.module ?? config.module),
    placeholder: placeholder ?? config.placeholder,
    select: select ?? config.select,
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
