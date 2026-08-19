import {
  describe,
  it,
  expect
} from 'vitest'
import sharp from 'sharp'
import webpack from 'webpack'
import { rspack } from '@rspack/core'
import {
  type CompilerLike,
  createFixtureProject,
  compile,
  bundleUsage,
  imageWidth,
  imageHeight
} from '../test/bundler.mock.ts'

const defaultEntry = `import url, { src, srcSet, srcMap, placeholder } from './image.jpg'
export { url as default, src, srcSet, srcMap, placeholder }
`
const ruleEntry = `import url, { src, srcSet, srcMap } from './image.jpg?{ "width": [0.5, 1], "format": ["webp", "jpg"] }'
export { url as default, src, srcSet, srcMap }
`
const selectEntry = `import url, { srcMap } from './image.jpg?{ "width": [0.5, 1], "format": ["webp", "jpg"] }&format=webp&width=320'
export { url as default, srcMap }
`
// Multiple formats and widths, so the module has distinctive markers:
// `image/webp` (a `type` field) only lives inside `srcSet` variant objects,
// so its presence tracks whether `srcSet` survived tree-shaking.
const treeShakeOptions = {
  skipOptimization: true,
  rules: [
    {
      width: [1, 0.5],
      format: ['jpg', 'webp']
    }
  ]
}

function usageEntry(imports: string) {
  return `import { ${imports} } from './image.jpg'\nglobalThis.__srcsetOutput = { ${imports} }\n`
}

type CreateCompiler = (config: object) => CompilerLike

const bundlers = [
  ['webpack', webpack as unknown as CreateCompiler],
  ['rspack', rspack as unknown as CreateCompiler]
] as const

describe('loader', () => {
  describe('srcSetLoader', () => {
    describe.each(bundlers)('%s', (_name, createCompiler) => {
      it('should build module with default options', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const {
          assets,
          exports
        } = await compile(createCompiler, dir, {
          skipOptimization: true
        })

        expect(exports.default).toMatch(/^\/assets\/image\.[0-9a-f]{8}\.jpg$/)
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
        expect(assets).toEqual([exports.default.replace('/assets/', '')])
      })

      it('should apply rule from import query', async () => {
        const dir = await createFixtureProject(ruleEntry)
        const {
          assets,
          exports
        } = await compile(createCompiler, dir, {
          skipOptimization: true
        })
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

      it('should select default export variant from query', async () => {
        const dir = await createFixtureProject(selectEntry)
        const { exports } = await compile(createCompiler, dir, {
          skipOptimization: true
        })

        expect(exports.default).toBe(exports.srcMap[`webp${imageWidth / 2}`])
        expect(exports.default).toMatch(/\.webp$/)
      })

      it('should apply rules option with matching', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const { exports } = await compile(createCompiler, dir, {
          skipOptimization: true,
          rules: [
            {
              match: '**/*.jpg',
              width: [0.5, 1]
            },
            {
              match: '**/*.png',
              width: [0.25]
            }
          ]
        })

        expect(exports.srcSet.length).toBe(2)
        expect(exports.default).toBe(exports.srcMap[`jpg${imageWidth}`])
      })

      it('should use hashless file names in development mode', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const {
          assets,
          exports
        } = await compile(createCompiler, dir, {
          skipOptimization: true
        }, 'development')

        expect(exports.default).toBe('/assets/image.jpg')
        expect(assets).toEqual(['image.jpg'])
      })

      it('should keep the source extension of a converted image in development mode', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const { assets } = await compile(createCompiler, dir, {
          skipOptimization: true,
          rules: [
            {
              width: [1],
              format: ['webp']
            }
          ]
        }, 'development')

        expect(assets).toEqual(['image.jpg.webp'])
      })

      it('should export placeholder data-url when enabled', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const { exports } = await compile(createCompiler, dir, {
          skipOptimization: true,
          placeholder: true
        })

        expect(exports.placeholder).toMatch(/^data:image\/webp;base64,/)

        const decoded = Buffer.from((exports.placeholder as string).split(',')[1], 'base64')
        const metadata = await sharp(decoded).metadata()

        expect(metadata.width).toBe(16)
      })

      it('should export placeholder together with a matched rule', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const { exports } = await compile(createCompiler, dir, {
          skipOptimization: true,
          placeholder: true,
          rules: [
            {
              match: '**/*.jpg',
              width: [0.5]
            }
          ]
        })

        expect(exports.placeholder).toMatch(/^data:image\/webp;base64,/)
        expect(exports.srcSet.length).toBe(1)
      })

      it('should export undefined placeholder by default', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const { exports } = await compile(createCompiler, dir, {
          skipOptimization: true
        })

        expect(exports.placeholder).toBeUndefined()
      })

      it('should not emit files when emitFile is disabled', async () => {
        const dir = await createFixtureProject(defaultEntry)
        const {
          assets,
          exports
        } = await compile(createCompiler, dir, {
          skipOptimization: true,
          emitFile: false
        })

        expect(assets).toEqual([])
        expect(exports.default).toMatch(/^\/assets\/image\./)
      })

      describe('tree shaking', () => {
        it('should keep only src when only src is used', async () => {
          const dir = await createFixtureProject(usageEntry('src'))
          const {
            code,
            usedExports
          } = await bundleUsage(createCompiler, dir, treeShakeOptions)

          expect(usedExports).toEqual(['src'])
          // src is jpg, so its type stays, while srcSet variant objects (with the
          // webp type) and the srcMap keys are dropped.
          expect(code).toContain('image/jpeg')
          expect(code).not.toContain('image/webp')
          expect(code).not.toContain(`webp${imageWidth / 2}`)
        })

        it('should drop srcMap when only srcSet is used', async () => {
          const dir = await createFixtureProject(usageEntry('srcSet'))
          const {
            code,
            usedExports
          } = await bundleUsage(createCompiler, dir, treeShakeOptions)
          // Id of a non-default variant: it lives in the srcSet object as an `id`
          // field and, if kept, in the srcMap as a key. srcMap and srcSet share the
          // same data, so a duplicate-count is the only way to tell them apart.
          const variantId = `webp${imageWidth / 2}`
          const occurrences = code.split(variantId).length - 1

          expect(usedExports).toEqual(['srcSet'])
          // srcSet keeps every variant object, so the webp type stays.
          expect(code).toContain('image/webp')
          // A single occurrence proves srcMap (the second reference) was dropped.
          expect(occurrences).toBe(1)
        })

        it('should drop placeholder when unused', async () => {
          const dir = await createFixtureProject(usageEntry('src'))
          const { code } = await bundleUsage(createCompiler, dir, {
            ...treeShakeOptions,
            placeholder: true
          })

          expect(code).not.toContain('data:image/')
        })

        it('should keep placeholder when used', async () => {
          const dir = await createFixtureProject(usageEntry('placeholder'))
          const {
            code,
            usedExports
          } = await bundleUsage(createCompiler, dir, {
            ...treeShakeOptions,
            placeholder: true
          })

          expect(usedExports).toEqual(['placeholder'])
          expect(code).toContain('data:image/webp;base64,')
        })

        it('should drop src and srcSet objects when only srcMap is used', async () => {
          const dir = await createFixtureProject(usageEntry('srcMap'))
          const {
            code,
            usedExports
          } = await bundleUsage(createCompiler, dir, treeShakeOptions)

          expect(usedExports).toEqual(['srcMap'])
          // srcMap has no variant objects, so no `type` field survives, but its keys do.
          expect(code).not.toContain('image/jpeg')
          expect(code).not.toContain('image/webp')
          expect(code).toContain(`webp${imageWidth / 2}`)
        })
      })
    })
  })
})
