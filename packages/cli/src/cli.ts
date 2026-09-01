import process from 'node:process'
import {
  usage,
  parseCliArgs
} from './args.ts'
import { loadConfig } from './config.ts'
import { toCliOptions } from './options.ts'
import { run } from './run.ts'

try {
  const args = parseCliArgs()

  if (args.help) {
    console.info(usage)
    process.exit(0)
  }

  await run(toCliOptions(args, await loadConfig(args.config)))
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
