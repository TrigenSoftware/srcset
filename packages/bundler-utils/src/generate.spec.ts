import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import sharp from 'sharp'
import { generateSrcSetModule } from './generate.ts'

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

      it('should stop after the first matched rule', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
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

      it('should keep matching after a fallthrough rule', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
              fallthrough: true,
              width: [0.5]
            },
            {
              width: [0.25]
            }
          ]
        }, emitToPath)

        expect(module).toContain('"jpg320"')
        expect(module).toContain('"jpg160"')
      })

      it('should deduplicate variants of overlapping fallthrough rules', async () => {
        const image = await createImage()
        const emitImage = vi.fn(emitToPath)
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
              fallthrough: true,
              width: [0.5, 1]
            },
            {
              width: [320, 0.25]
            }
          ]
        }, emitImage)

        expect(emitImage).toHaveBeenCalledTimes(3)
        expect(module.match(/"jpg320":/g)?.length).toBe(1)
        expect(module).toContain('"jpg160"')
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

      it('should keep the configured placeholder options for the query flag', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {
          placeholder: true
        }, {
          skipOptimization: true,
          placeholder: {
            format: 'jpg'
          }
        }, emitToPath)

        expect(module).toMatch(/export const placeholder = "data:image\/jpeg;base64,/)
      })

      it('should disable the placeholder from the query', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {
          placeholder: false
        }, {
          skipOptimization: true,
          placeholder: {
            format: 'jpg'
          }
        }, emitToPath)

        expect(module).toContain('export const placeholder = undefined;')
      })

      it('should select the requested format at the first width of the rule', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {
          select: {
            format: 'webp'
          }
        }, {
          rules: [
            {
              format: ['jpg', 'webp'],
              width: [1, 0.5]
            }
          ]
        }, emitToPath)

        expect(module).toContain('const url = "/images/image.webp";')
      })

      it('should select the requested width in the first format of the rule', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {
          select: {
            width: 320
          }
        }, {
          rules: [
            {
              format: ['webp', 'jpg'],
              width: [1, 0.5]
            }
          ]
        }, emitToPath)

        expect(module).toContain('const url = "/images/image@320w.webp";')
      })

      it('should prefer the select from the query over the options', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {
          select: {
            id: 'webp320'
          }
        }, {
          select: {
            id: 'jpg320'
          },
          rules: [
            {
              format: ['jpg', 'webp'],
              width: [0.5]
            }
          ]
        }, emitToPath)

        expect(module).toContain('const url = "/images/image@320w.webp";')
      })

      it('should select the original variant without an explicit select', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
              format: ['webp', 'jpg'],
              width: [1, 0.5]
            }
          ]
        }, emitToPath)

        expect(module).toContain('const url = "/images/image.jpg";')
      })

      it('should fall back to the first variant when nothing matches the select', async () => {
        const image = await createImage()
        const module = await generateSrcSetModule(image, {}, {
          rules: [
            {
              format: ['webp', 'jpg'],
              width: [0.5]
            }
          ]
        }, emitToPath)

        expect(module).toContain('const url = "/images/image@320w.webp";')
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
    })
  })
})
