import type {
  ImageFormat,
  SrcSetRule
} from '@srcset/core'
import {
  rest,
  alias,
  autocase,
  flag,
  option,
  readOptions
} from 'argue-cli'

export const usage = `srcset [...sources] [...options]

  sources               Source image(s) glob patterns.
  --help, -h            Print this message.
  --verbose, -v         Print processed images.
  --match, -m           Glob pattern or media query to match images by name or size. Repeat to add more - all of them must match.
  --width, -w           Output image(s) widths to resize, value less than or equal to 1 is treated as a multiplier.
  --format, -f          Output image(s) formats to convert.
  --skip-optimization   Do not optimize output images.
  --no-scaling-up       Do not generate images larger than the source.
  --dest, -d            Destination directory.
  --module              Generate an image module: ts, js, ts-dir or js-dir.
  --config, -c          Config file path. Defaults to the \`srcset.config.js\` lookup.
  --concurrency         Concurrency limit.
`

export interface CliArgs {
  help: boolean
  verbose: boolean | undefined
  sources: string[]
  rule: SrcSetRule | null
  skipOptimization: boolean | undefined
  scalingUp: boolean | undefined
  dest: string | undefined
  module: string | undefined
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
    module: moduleFormat,
    config,
    concurrency
  } = readOptions(
    flag(alias('help', 'h')),
    flag(alias('verbose', 'v')),
    option(alias('match', 'm'), [String]),
    option(alias('width', 'w'), Array),
    option(alias('format', 'f'), Array),
    flag(autocase('skipOptimization')),
    flag(autocase('scalingUp')),
    option(alias('dest', 'd'), String),
    option('module', String),
    option(alias('config', 'c'), String),
    option('concurrency', Number)
  )
  const rule: SrcSetRule = {
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
  const sources = rest()
  // Whatever the readers did not take stays in `argv`: a leftover flag is a
  // typo, and treating it as a glob would quietly match nothing.
  const unknownOption = sources.find(source => source.startsWith('-'))

  if (unknownOption) {
    throw new Error(`Unknown option: "${unknownOption}".`)
  }

  return {
    help: Boolean(help),
    verbose,
    sources,
    rule: Object.keys(rule).length ? rule : null,
    skipOptimization,
    scalingUp,
    dest,
    module: moduleFormat,
    config,
    concurrency
  }
}
