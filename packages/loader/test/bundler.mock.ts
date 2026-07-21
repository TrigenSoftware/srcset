import {
  mkdtemp,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import {
  Volume,
  createFsFromVolume
} from 'memfs'
import type { SrcSetEntry } from '@srcset/runtime'

// Bundlers load the loader shim with plain Node.js module resolution, outside of the
// Vite pipeline. It works without a build step: Node natively strips types from the
// TS sources, and relative imports use explicit `.ts` extensions.
export const loaderPath = fileURLToPath(new URL('./loader.shim.mjs', import.meta.url))

export const imageWidth = 640
export const imageHeight = 480

const channels = 3
const colorDepth = 256

/**
 * Create a temporary project directory with a noise image and an entry file.
 * @param entrySource - Entry file source code.
 * @returns Project directory path.
 */
export async function createFixtureProject(entrySource: string) {
  const dir = await mkdtemp(path.join(tmpdir(), 'srcset-loader-'))
  const raw = Buffer.alloc(imageWidth * imageHeight * channels)

  for (let i = 0; i < raw.length; i++) {
    raw[i] = Math.floor(Math.random() * colorDepth)
  }

  const image = await sharp(raw, {
    raw: {
      width: imageWidth,
      height: imageHeight,
      channels
    }
  }).jpeg({
    quality: 90
  }).toBuffer()

  await writeFile(path.join(dir, 'image.jpg'), image)
  await writeFile(path.join(dir, 'entry.js'), entrySource)

  return dir
}

export interface ModuleExports {
  default: string
  src: SrcSetEntry | null
  srcSet: SrcSetEntry[]
  srcMap: Record<string, string>
  placeholder: string | undefined
}

export interface BuildResult {
  assets: string[]
  exports: ModuleExports
}

interface StatsModule {
  name?: string
  usedExports?: string[] | boolean | null
  modules?: StatsModule[]
}

interface StatsJson {
  modules?: StatsModule[]
}

interface StatsLike {
  hasErrors(): boolean
  toString(options?: unknown): string
  toJson(options?: unknown): StatsJson
}

export interface CompilerLike {
  outputFileSystem: unknown
  run(callback: (error: Error | null, stats?: StatsLike) => void): void
}

/**
 * Compile the fixture project and evaluate the bundle exports.
 * @param createCompiler - Bundler factory, accepts the config.
 * @param dir - Project directory path.
 * @param loaderOptions - Loader options.
 * @returns Emitted asset names and evaluated bundle exports.
 */
export async function compile(
  createCompiler: (config: object) => CompilerLike,
  dir: string,
  loaderOptions: object = {},
  mode: 'production' | 'development' = 'production'
): Promise<BuildResult> {
  const volume = new Volume()
  const outputFileSystem = createFsFromVolume(volume)
  const compiler = createCompiler({
    context: dir,
    mode,
    devtool: false,
    target: 'node',
    entry: './entry.js',
    experiments: {
      outputModule: true
    },
    output: {
      path: '/dist',
      publicPath: '/assets/',
      filename: 'main.mjs',
      library: {
        type: 'module'
      }
    },
    module: {
      rules: [
        {
          test: /\.jpe?g$/i,
          use: [
            {
              loader: loaderPath,
              options: loaderOptions
            }
          ]
        }
      ]
    }
  })

  compiler.outputFileSystem = outputFileSystem

  const stats = await new Promise<StatsLike | undefined>((resolve, reject) => {
    compiler.run((error, runStats) => {
      if (error) {
        reject(error)
      } else {
        resolve(runStats)
      }
    })
  })

  if (stats?.hasErrors()) {
    throw new Error(stats.toString({
      errors: true
    }))
  }

  const code = volume.readFileSync('/dist/main.mjs', 'base64') as string
  const moduleExports = await import(
    /* @vite-ignore */
    `data:text/javascript;base64,${code}`
  ) as ModuleExports
  const assets = Object.keys(volume.toJSON())
    .map(assetPath => path.posix.basename(assetPath))
    .filter(assetName => assetName !== 'main.mjs')

  return {
    assets,
    exports: moduleExports
  }
}

export interface UsageResult {
  /**
   * Minified production bundle code.
   */
  code: string
  /**
   * Exports of the image module the bundler determined are used.
   */
  usedExports: string[] | null
}

function findImageModule(modules: StatsModule[] = []): StatsModule | undefined {
  for (const module of modules) {
    if ((module.name ?? '').includes('image.jpg')) {
      return module
    }

    const nested = findImageModule(module.modules)

    if (nested) {
      return nested
    }
  }

  return undefined
}

/**
 * Bundle a fixture that uses a subset of the image module exports and report
 * what survives tree-shaking. Unlike `compile`, this is a plain (non-library) build,
 * so unused exports of the image module are actually eliminated.
 * @param createCompiler - Bundler factory, accepts the config.
 * @param dir - Project directory path.
 * @param loaderOptions - Loader options.
 * @returns Minified bundle code and the image module used exports.
 */
export async function bundleUsage(
  createCompiler: (config: object) => CompilerLike,
  dir: string,
  loaderOptions: object = {}
): Promise<UsageResult> {
  const volume = new Volume()
  const compiler = createCompiler({
    context: dir,
    mode: 'production',
    devtool: false,
    target: 'node',
    entry: './entry.js',
    output: {
      path: '/dist',
      publicPath: '/assets/',
      filename: 'main.js'
    },
    optimization: {
      usedExports: true
    },
    module: {
      rules: [
        {
          test: /\.jpe?g$/i,
          use: [
            {
              loader: loaderPath,
              options: loaderOptions
            }
          ]
        }
      ]
    }
  })

  compiler.outputFileSystem = createFsFromVolume(volume)

  const stats = await new Promise<StatsLike | undefined>((resolve, reject) => {
    compiler.run((error, runStats) => {
      if (error) {
        reject(error)
      } else {
        resolve(runStats)
      }
    })
  })

  if (stats?.hasErrors()) {
    throw new Error(stats.toString({
      errors: true
    }))
  }

  const code = volume.readFileSync('/dist/main.js', 'utf8') as string
  const json = stats?.toJson({
    usedExports: true,
    modules: true,
    nestedModules: true
  })
  const imageModule = findImageModule(json?.modules)
  const usedExports = Array.isArray(imageModule?.usedExports)
    ? [...imageModule.usedExports].sort()
    : null

  return {
    code,
    usedExports
  }
}
