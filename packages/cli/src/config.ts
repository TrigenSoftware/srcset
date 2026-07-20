import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { SrcSetCliOptions } from './types.ts'

const defaultConfigFile = 'srcset.config.js'

/**
 * Load the config file: an ES module with the options object as the default export.
 * @param path - Config file path. Without it `srcset.config.js` is looked up in the current directory.
 * @returns Config options, empty object if there is no config.
 */
export async function loadConfig(path?: string): Promise<Partial<SrcSetCliOptions>> {
  let file = path

  if (!file) {
    try {
      await access(defaultConfigFile)
      file = defaultConfigFile
    } catch {
      return {}
    }
  }

  const module = await import(pathToFileURL(resolve(file)).href) as {
    default?: Partial<SrcSetCliOptions>
  }

  return module.default ?? {}
}
