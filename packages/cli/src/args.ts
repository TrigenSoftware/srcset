import type { ImageFormat } from '@srcset/core'
import {
  rest,
  alias,
  autocase,
  flag,
  option,
  readOptions
} from 'argue-cli'
import type { SrcSetCliRule } from './types.ts'

export const usage = `srcset [...sources] [...options]

  sources               Source image(s) glob patterns.
  --help, -h            Print this message.
  --verbose, -v         Print processed images.
  --match, -m           Glob pattern(s) or media query(ies) to match images by name or size.
  --width, -w           Output image(s) widths to resize, value less than or equal to 1 is treated as a multiplier.
  --format, -f          Output image(s) formats to convert.
  --skip-optimization   Do not optimize output images.
  --no-scaling-up       Do not generate images larger than the source.
  --dest, -d            Destination directory.
  --config, -c          Config file path. Defaults to the \`srcset.config.js\` lookup.
  --concurrency         Concurrency limit.
`

export interface CliArgs {
  help: boolean
  verbose: boolean | undefined
  sources: string[]
  rule: SrcSetCliRule | null
  skipOptimization: boolean | undefined
  scalingUp: boolean | undefined
  dest: string | undefined
  config: string | undefined
  concurrency: number | undefined
}

/**
 * Parse command line arguments.
 * @returns Parsed options.
 */
export function parseCliArgs(): CliArgs {
  const {
    help,
    verbose,
    match,
    width,
    format,
    skipOptimization,
    scalingUp,
    dest,
    config,
    concurrency
  } = readOptions(
    flag(alias('help', 'h')),
    flag(alias('verbose', 'v')),
    option(alias('match', 'm'), Array),
    option(alias('width', 'w'), Array),
    option(alias('format', 'f'), Array),
    flag(autocase('skipOptimization')),
    flag(autocase('scalingUp')),
    option(alias('dest', 'd'), String),
    option(alias('config', 'c'), String),
    option('concurrency', Number)
  )
  const rule: SrcSetCliRule = {
    ...match && {
      match
    },
    ...width && {
      width: width.map(Number)
    },
    ...format && {
      format: format as ImageFormat[]
    }
  }

  return {
    help: Boolean(help),
    verbose,
    sources: rest(),
    rule: Object.keys(rule).length ? rule : null,
    skipOptimization,
    scalingUp,
    dest,
    config,
    concurrency
  }
}
