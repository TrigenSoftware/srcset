import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import sharp from 'sharp'
import pLimit from 'p-limit'
import type { SrcSetBackend } from './generate.types.ts'
import {
  generateSrcSetModule,
  srcsetBackend
} from './generate.ts'

async function createImage(width = 640, height = 480) {
  const contents = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: '#3a7bd5'
    }
  }).jpeg().toBuffer()

  return {
    path: '/images/image.jpg',
    contents
  }
}

function emitToPath(image: { path: string }) {
  return {
    outputPath: image.path,
    publicPath: image.path
  }
}

describe('bundler-utils', () => {
  describe('generate', () => {
    describe('generateSrcSetModule', () => {
      it('should generate module for matched rules', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
              width: [1, 0.5]
            }
          ]
        }, emitToPath)

        expect(module).toContain('const url = "/images/image.jpg";')
        expect(module).toContain('"jpg640": url')
        expect(module).toContain('"jpg320": "/images/image@320w.jpg"')
        expect(module).toContain('export const placeholder = undefined;')
      })

      it('should prefer rules from query', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {
          rules: [
            {
              width: [0.25]
            }
          ]
        }, {
          rules: [
            {
              width: [1, 0.5]
            }
          ]
        }, emitToPath)

        expect(module).toContain('"jpg160"')
        expect(module).not.toContain('"jpg640"')
      })

      it('should skip rules not matching the image', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
              match: '**/*.png',
              width: [1]
            }
          ]
        }, emitToPath)

        expect(module).toContain("const url = '';")
        expect(module).toContain('export const srcSet = [];')
      })

      it('should stop after only rule', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
              only: true,
              width: [0.5]
            },
            {
              width: [0.25]
            }
          ]
        }, emitToPath)

        expect(module).toContain('"jpg320"')
        expect(module).not.toContain('"jpg160"')
      })

      it('should inline placeholder data-url', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(
          image,
          {},
          {
            skipOptimization: true,
            placeholder: true
          },
          emitToPath
        )

        expect(module).toMatch(/export const placeholder = "data:image\/webp;base64,[^"]+";/)
      })

      it('should pass options, emitImage and limit to the backend', async () => {
        const limit = pLimit(1)
        let received: unknown[] = []
        const backend: typeof srcsetBackend = (backendOptions, backendEmitImage, backendLimit) => {
          received = [backendOptions, backendEmitImage, backendLimit]

          return srcsetBackend(backendOptions, backendEmitImage, backendLimit)
        }
        const image = await createImage()
        const options = {
          skipOptimization: true,
          backend
        }

        await generateSrcSetModule(image, {}, options, emitToPath, limit)

        expect(received[0]).toBe(options)
        expect(received[1]).toBe(emitToPath)
        expect(received[2]).toBe(limit)
      })

      it('should build public path expression without a plain public path', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          skipOptimization: true
        }, (emitted: { path: string }) => ({
          outputPath: emitted.path,
          publicPath: null,
          publicPathExpression: '__webpack_public_path__'
        }))

        expect(module).toContain('const url = (__webpack_public_path__) + "/images/image.jpg";')
      })

      it('should fall back to the output path url without a public path expression', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          skipOptimization: true
        }, (emitted: { path: string }) => ({
          outputPath: emitted.path,
          publicPath: null
        }))

        expect(module).toContain('const url = "/images/image.jpg";')
      })

      it('should use url variants without emitting', async () => {
        const image = await createImage()
        const emitImage = vi.fn(emitToPath)
        const urlBackend: SrcSetBackend = {
          * generate(_source, metadata, rule) {
            const [width = 1] = Array.isArray(rule.width) ? rule.width : [rule.width]

            yield {
              format: metadata.format,
              width: width <= 1 ? metadata.width : width,
              height: metadata.height,
              originMultiplier: width <= 1 ? width : null,
              url: `https://proxy.test/w:${String(width)}`
            }
          }
        }
        const module = await generateSrcSetModule(image, {}, {
          backend: () => urlBackend,
          rules: [
            {
              width: [320]
            }
          ]
        }, emitImage)

        expect(emitImage).not.toHaveBeenCalled()
        expect(module).toContain('const url = "https://proxy.test/w:320";')
      })
    })
  })
})
