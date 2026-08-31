import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import {
  mkdir,
  copyFile,
  readdir,
  writeFile
} from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {
  type Rolldown,
  build,
  createServer
} from 'vite'
import { srcset } from './plugin.ts'
import {
  type ModuleExports,
  createFixtureProject,
  imageWidth,
  imageHeight
} from '../test/vite.mock.ts'

const defaultEntry = `import url, { src, srcSet, srcMap, placeholder } from './image.jpg'
export { url as default, src, srcSet, srcMap, placeholder }
`
const ruleEntry = `import url, { src, srcSet, srcMap } from './image.jpg?{ "width": [0.5, 1], "format": ["webp", "jpg"] }'
export { url as default, src, srcSet, srcMap }
`

async function buildFixture(dir: string, pluginOptions = {}) {
  const result = await build({
    configFile: false,
    logLevel: 'error',
    root: dir,
    base: '/assets/',
    plugins: [srcset({
      skipOptimization: true,
      ...pluginOptions
    })],
    build: {
      write: false,
      minify: false,
      rolldownOptions: {
        input: path.join(dir, 'entry.js'),
        preserveEntrySignatures: 'strict',
        output: {
          entryFileNames: 'entry.js'
        }
      }
    }
  }) as Rolldown.RolldownOutput
  const chunk = result.output.find(
    (item): item is Rolldown.OutputChunk => item.type === 'chunk' && item.isEntry
  )
  const assets = result.output.filter(
    (item): item is Rolldown.OutputAsset => item.type === 'asset'
  )
  const exports = await import(
    /* @vite-ignore */
    `data:text/javascript;base64,${Buffer.from(chunk?.code ?? '').toString('base64')}`
  ) as ModuleExports

  return {
    assets,
    exports
  }
}

describe('vite-plugin', () => {
  describe('srcset', () => {
    describe('build', () => {
      it('should build module with default options', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const {
          assets,
          exports
        } = await buildFixture(dir)

        expect(exports.default).toMatch(/^\/assets\/.*image.*\.jpg$/)
        expect(exports.src).toEqual({
          id: `jpg${imageWidth}`,
          format: 'jpg',
          type: 'image/jpeg',
          width: imageWidth,
          height: imageHeight,
          url: exports.default
        })
        expect(exports.srcSet).toEqual([exports.src])
        expect(exports.srcMap).toEqual({
          [`jpg${imageWidth}`]: exports.default
        })
        expect(exports.placeholder).toBeUndefined()
        expect(assets.some(asset => exports.default.endsWith(asset.fileName))).toBe(true)
      })

      it('should apply rule from import query', async () => {
        const dir = await createFixtureProject(ruleEntry)
        const {
          assets,
          exports
        } = await buildFixture(dir)
        const halfWidth = imageWidth / 2

        expect(exports.srcSet.length).toBe(4)
        expect(Object.keys(exports.srcMap).sort()).toEqual([
          `jpg${halfWidth}`,
          `jpg${imageWidth}`,
          `webp${halfWidth}`,
          `webp${imageWidth}`
        ])
        expect(exports.default).toBe(exports.srcMap[`jpg${imageWidth}`])
        expect(assets.length).toBe(4)
      })

      it('should leave public directory imports to Vite', async () => {
        const dir = await createFixtureProject(`import logo from '/logo.png'
export default logo
`)

        await mkdir(path.join(dir, 'public'))
        await copyFile(path.join(dir, 'image.jpg'), path.join(dir, 'public', 'logo.png'))

        const { exports } = await buildFixture(dir)

        // Vite serves public assets from the base url root.
        expect(exports.default).toBe('/assets/logo.png')
      })

      it('should reuse the disk cache across builds', async () => {
        const dir = await createFixtureProject(ruleEntry)
        const optimize = vi.fn((contents: Buffer) => contents)
        const buildOptions = {
          skipOptimization: false,
          optimization: {
            jpg: optimize
          }
        }
        const first = await buildFixture(dir, buildOptions)
        const generatedCalls = optimize.mock.calls.length

        expect(generatedCalls).toBeGreaterThan(0)

        const second = await buildFixture(dir, buildOptions)

        expect(optimize.mock.calls.length).toBe(generatedCalls)
        expect(second.exports.srcSet.length).toBe(4)
        expect(second.exports.default).toBe(first.exports.default)
        expect(second.assets.length).toBe(first.assets.length)
      })

      it('should cache in the configured directory', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const cacheDir = path.join(dir, 'custom-cache')

        await buildFixture(dir, {
          cache: {
            dir: cacheDir
          }
        })

        expect((await readdir(cacheDir)).length).toBeGreaterThan(0)
      })

      it('should prune the cache when the build is over', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const cacheDir = path.join(dir, 'custom-cache')
        const key = 'a'.repeat(64)

        await mkdir(cacheDir, {
          recursive: true
        })
        await writeFile(path.join(cacheDir, `${key}.json`), JSON.stringify({
          usedAt: Date.now() - 31 * 24 * 60 * 60 * 1000
        }))
        await writeFile(path.join(cacheDir, `${key}-stale.webp`), 'stale')
        await buildFixture(dir, {
          cache: {
            dir: cacheDir
          }
        })

        const left = await readdir(cacheDir)

        expect(left.some(name => name.startsWith(key))).toBe(false)
        expect(left.length).toBeGreaterThan(0)
      })

      it('should regenerate with the cache disabled', async () => {
        const dir = await createFixtureProject(ruleEntry)
        const optimize = vi.fn((contents: Buffer) => contents)
        const buildOptions = {
          skipOptimization: false,
          cache: false,
          optimization: {
            jpg: optimize
          }
        }
        const first = await buildFixture(dir, buildOptions)
        const generatedCalls = optimize.mock.calls.length

        expect(generatedCalls).toBeGreaterThan(0)
        expect(first.exports.srcSet.length).toBe(4)

        await buildFixture(dir, buildOptions)

        expect(optimize.mock.calls.length).toBe(generatedCalls * 2)
      })

      it('should export placeholder data-url when enabled', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const { exports } = await buildFixture(dir, {
          placeholder: true
        })

        expect(exports.placeholder).toMatch(/^data:image\/webp;base64,/)

        const decoded = Buffer.from((exports.placeholder as string).split(',')[1], 'base64')
        const metadata = await sharp(decoded).metadata()

        expect(metadata.width).toBe(16)
      })
    })

    describe('dev', () => {
      it('should serve variants under a non-root base', async () => {
        const dir = await createFixtureProject(ruleEntry)
        const server = await createServer({
          configFile: false,
          logLevel: 'error',
          root: dir,
          base: '/assets/',
          plugins: [srcset({
            skipOptimization: true
          })]
        })

        try {
          await server.listen()

          const address = server.httpServer?.address()
          const port = typeof address === 'object' && address ? address.port : 0
          const exports = await server.ssrLoadModule('/entry.js') as ModuleExports

          expect(exports.default).toMatch(/^\/assets\/@srcset\/[0-9a-f]{64}\/image\.jpg$/)

          const response = await fetch(`http://localhost:${port}${exports.default}`)

          expect(response.status).toBe(200)
        } finally {
          await server.close()
        }
      })

      it('should serve same-named sources apart', async () => {
        const dir = await createFixtureProject(`import a from './a/logo.jpg'
import b from './b/logo.jpg'
export { a as default, b as src }
`)

        await mkdir(path.join(dir, 'a'))
        await mkdir(path.join(dir, 'b'))
        await copyFile(path.join(dir, 'image.jpg'), path.join(dir, 'a', 'logo.jpg'))
        await sharp({
          create: {
            width: imageWidth,
            height: imageHeight,
            channels: 3,
            background: '#3a7bd5'
          }
        }).jpeg().toFile(path.join(dir, 'b', 'logo.jpg'))

        const server = await createServer({
          configFile: false,
          logLevel: 'error',
          root: dir,
          plugins: [srcset({
            skipOptimization: true
          })]
        })

        try {
          await server.listen()

          const address = server.httpServer?.address()
          const port = typeof address === 'object' && address ? address.port : 0
          const exports = await server.ssrLoadModule('/entry.js') as ModuleExports
          const secondUrl = exports.src as unknown as string

          expect(exports.default).not.toBe(secondUrl)

          const [first, second] = await Promise.all([
            fetch(`http://localhost:${port}${exports.default}`).then(response => response.arrayBuffer()),
            fetch(`http://localhost:${port}${secondUrl}`).then(response => response.arrayBuffer())
          ])

          expect(Buffer.from(first).equals(Buffer.from(second))).toBe(false)
        } finally {
          await server.close()
        }
      })

      it('should serve stable variants across server restarts', async () => {
        const dir = await createFixtureProject(ruleEntry)
        const load = async () => {
          const server = await createServer({
            configFile: false,
            logLevel: 'error',
            root: dir,
            plugins: [srcset({
              skipOptimization: true
            })]
          })

          try {
            await server.listen()

            return await server.ssrLoadModule('/entry.js') as ModuleExports
          } finally {
            await server.close()
          }
        }
        const first = await load()
        const second = await load()

        expect(second.srcSet.length).toBe(4)
        expect(second.srcSet).toEqual(first.srcSet)
      })

      it('should serve module and variants from dev server', async () => {
        const dir = await createFixtureProject(ruleEntry)
        const server = await createServer({
          configFile: false,
          logLevel: 'error',
          root: dir,
          plugins: [srcset({
            skipOptimization: true
          })]
        })

        try {
          await server.listen()

          const address = server.httpServer?.address()
          const port = typeof address === 'object' && address ? address.port : 0
          const exports = await server.ssrLoadModule('/entry.js') as ModuleExports
          const halfWidth = imageWidth / 2

          expect(exports.srcSet.length).toBe(4)
          expect(exports.default).toMatch(/^\/@srcset\/[0-9a-f]{64}\/image\.jpg$/)

          const webpUrl = exports.srcMap[`webp${halfWidth}`]
          const response = await fetch(`http://localhost:${port}${webpUrl}`)

          expect(response.status).toBe(200)
          expect(response.headers.get('content-type')).toBe('image/webp')

          const contents = Buffer.from(await response.arrayBuffer())
          const metadata = await sharp(contents).metadata()

          expect(metadata.format).toBe('webp')
          expect(metadata.width).toBe(halfWidth)
        } finally {
          await server.close()
        }
      })
    })
  })
})
