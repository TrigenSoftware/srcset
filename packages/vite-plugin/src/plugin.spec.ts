import {
  describe,
  it,
  expect
} from 'vitest'
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

      it('should emit the original for a backend enforcing public path', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const urlBackend = (
          _options: unknown,
          emitImage: (image: unknown) => {
            outputPath: string
            publicPath: string | null
          }
        ) => ({
          * generate(source: {
            path: string
            contents: Buffer
          }, metadata: {
            format: string
            width: number
            height: number
          }) {
            const { publicPath: publicUrl } = emitImage({
              path: source.path,
              contents: source.contents,
              format: metadata.format,
              width: metadata.width,
              height: metadata.height,
              postfix: '',
              originMultiplier: 1
            })

            yield {
              format: metadata.format,
              width: metadata.width,
              height: metadata.height,
              originMultiplier: 1,
              url: `https://proxy.test/plain${publicUrl ?? ''}`
            }
          }
        })
        const {
          assets,
          exports
        } = await buildFixture(dir, {
          backend: urlBackend
        })
        const [original] = assets

        expect(assets.length).toBe(1)
        // The `__VITE_ASSET__` placeholder is replaced inside the built url string.
        expect(exports.default).toBe(`https://proxy.test/plain/assets/${original.fileName}`)
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
          expect(exports.default).toMatch(/^\/@srcset\/image\.[0-9a-f]{8}\.jpg$/)

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
