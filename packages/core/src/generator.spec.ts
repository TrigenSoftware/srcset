import {
  describe,
  it,
  expect
} from 'vitest'
import {
  mkdtemp,
  readdir
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { SrcSetCacheStorage } from './cache.ts'
import { SrcSetGenerator } from './generator.ts'
import type {
  ImageSource,
  SrcSetImage,
  GenerateOptions
} from './types.ts'
import {
  createImage,
  createAnimatedImage,
  createOrientedImage,
  createSvg,
  fixtureWidth,
  fixtureHeight
} from '../test/image.mock.ts'

async function generateAll(generator: SrcSetGenerator, source: ImageSource, options?: GenerateOptions) {
  const images: SrcSetImage[] = []

  for await (const image of generator.generate(source, options)) {
    images.push(image)
  }

  return images
}

describe('core', () => {
  describe('generator', () => {
    describe('SrcSetGenerator', () => {
      it('should create correct instance', () => {
        const generator = new SrcSetGenerator()

        expect(typeof generator.generate).toBe('function')
      })

      it('should throw error on invalid source', async () => {
        const generator = new SrcSetGenerator()

        await expect(generateAll(generator, {
          path: '/images/image.jpg',
          contents: 'not a buffer' as unknown as Buffer
        })).rejects.toThrow('Invalid source')
      })

      it('should throw error on unsupported source contents', async () => {
        const generator = new SrcSetGenerator()

        await expect(generateAll(generator, {
          path: '/images/image.bmp',
          contents: Buffer.from('not an image')
        })).rejects.toThrow()
      })

      it('should throw error on unsupported requested format', async () => {
        const generator = new SrcSetGenerator()
        const image = await createImage('jpg', 64, 64)

        await expect(generateAll(generator, image, {
          format: 'bmp' as never
        })).rejects.toThrow('Unsupported image format')
      })

      it('should not mutate options arrays', async () => {
        const generator = new SrcSetGenerator({
          skipOptimization: true
        })
        const image = await createImage('jpg', 64, 64)
        const options = {
          format: [] as never[],
          width: [] as number[]
        }

        await generateAll(generator, image, options)

        expect(options.format).toEqual([])
        expect(options.width).toEqual([])
      })

      it('should throw error on invalid width', async () => {
        const generator = new SrcSetGenerator()
        const image = await createImage('jpg', 64, 64)

        await expect(generateAll(generator, image, {
          width: [-1]
        })).rejects.toThrow('Invalid width')
        await expect(generateAll(generator, image, {
          width: [320.5]
        })).rejects.toThrow('Invalid width')
      })

      describe('optimization', () => {
        it('should pass original contents through when optimization is skipped', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const [variant] = await generateAll(generator, image)

          expect(variant.contents).toBe(image.contents)
          expect(variant.path).toBe(image.path)
        })

        it('should reencode image by default', async () => {
          const generator = new SrcSetGenerator()
          const image = await createImage('jpg')
          const [variant] = await generateAll(generator, image)

          expect(variant.contents).not.toBe(image.contents)
          expect(variant.contents.length).toBeLessThan(image.contents.length)
        })

        it('should apply custom optimizer', async () => {
          const generator = new SrcSetGenerator({
            optimization: {
              jpg: () => Buffer.from('optimized')
            }
          })
          const image = await createImage('jpg')
          const [variant] = await generateAll(generator, image)

          expect(variant.contents.toString()).toBe('optimized')
        })

        it('should skip custom optimizer when optimization is skipped', async () => {
          const generator = new SrcSetGenerator({
            optimization: {
              jpg: () => Buffer.from('optimized')
            }
          })
          const image = await createImage('jpg')
          const [variant] = await generateAll(generator, image, {
            skipOptimization: true
          })

          expect(variant.contents).toBe(image.contents)
        })

        it('should apply processing options', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const [lowQuality] = await generateAll(generator, image, {
            width: [320],
            processing: {
              jpg: {
                quality: 10
              }
            }
          })
          const [highQuality] = await generateAll(generator, image, {
            width: [320],
            processing: {
              jpg: {
                quality: 90
              }
            }
          })

          expect(lowQuality.contents.length).toBeLessThan(highQuality.contents.length)
        })
      })

      describe('widths', () => {
        it('should generate desired widths', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            width: [1, 320, 160]
          })

          expect(images.length).toBe(3)
          expect(images[0].width).toBe(fixtureWidth)
          expect(images[1].width).toBe(320)
          expect(images[2].width).toBe(160)
        })

        it('should generate desired scaled widths', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            width: [0.33, 0.66, 1]
          })

          expect(images.length).toBe(3)
          expect(images[0].width).toBe(Math.ceil(fixtureWidth * 0.33))
          expect(images[1].width).toBe(Math.ceil(fixtureWidth * 0.66))
          expect(images[2].width).toBe(fixtureWidth)
        })

        it('should set originMultiplier', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const [w64, x1, xHalf] = await generateAll(generator, image, {
            scalingUp: false,
            width: [64, 1, 0.5]
          })

          expect(w64.originMultiplier).toBeNull()
          expect(x1.originMultiplier).toBe(1)
          expect(xHalf.originMultiplier).toBe(0.5)
        })

        it('should skip scaling up', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true,
            scalingUp: false
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            width: [1, 5000]
          })

          expect(images.length).toBe(1)
        })

        it('should emit higher width variant without upscaling pixels', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            width: [1, 5000]
          })

          expect(images.length).toBe(2)
          expect(images[1].width).toBe(fixtureWidth)
          expect(images[1].path).toBe(`/images/image@${fixtureWidth}w.jpg`)
          expect(images[1].postfix).toBe(`@${fixtureWidth}w`)
        })

        it('should keep a multiplier and an absolute width of the same target apart', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            width: [1, fixtureWidth]
          })

          expect(images.map(({ path }) => path)).toEqual([
            '/images/image.jpg',
            `/images/image@${fixtureWidth}w.jpg`
          ])
        })

        it('should keep the multiplier variant of a collision in either order', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const half = fixtureWidth / 2
          const [before] = await generateAll(generator, image, {
            width: [0.5, half]
          })
          const [after] = await generateAll(generator, image, {
            width: [half, 0.5]
          })

          expect(before.originMultiplier).toBe(0.5)
          expect(after.originMultiplier).toBe(0.5)
          expect(after.path).toBe(before.path)
        })

        it('should deduplicate widths resolving to the same target', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            width: [1920, 1280, fixtureWidth]
          })

          expect(images.length).toBe(1)
          expect(images[0].width).toBe(fixtureWidth)
        })

        it('should deduplicate identical variants', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            format: ['jpg', 'jpg'],
            width: [320, 320, 1]
          })

          expect(images.length).toBe(2)
        })
      })

      describe('formats', () => {
        it('should generate desired formats', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg', 64, 64)
          const images = await generateAll(generator, image, {
            format: ['jpg', 'webp', 'png']
          })

          expect(images.length).toBe(3)
          expect(images[0].format).toBe('jpg')
          expect(images[0].path).toBe('/images/image.jpg')
          expect(images[1].format).toBe('webp')
          expect(images[1].path).toBe('/images/image.webp')
          expect(images[2].format).toBe('png')
          expect(images[2].path).toBe('/images/image.png')
        })

        it('should support avif', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg', 64, 64)
          const [variant] = await generateAll(generator, image, {
            format: 'avif'
          })
          const metadata = await sharp(variant.contents).metadata()

          expect(variant.format).toBe('avif')
          expect(variant.path).toBe('/images/image.avif')
          expect(metadata.format).toBe('heif')
        })

        it('should generate desired formats with sizes', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            format: ['jpg', 'webp', 'png'],
            width: [0.33, 0.66, 1]
          })

          expect(images.length).toBe(9)
        })
      })

      describe('postfix', () => {
        it('should add default postfix', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const [variant] = await generateAll(generator, image, {
            width: [320]
          })

          expect(variant.path).toBe('/images/image@320w.jpg')
          expect(variant.postfix).toBe('@320w')
        })

        it('should add custom postfix', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true,
            postfix: '@postfix'
          })
          const image = await createImage('jpg')
          const [variant] = await generateAll(generator, image)

          expect(variant.path).toBe('/images/image@postfix.jpg')
          expect(variant.postfix).toBe('@postfix')
        })

        it('should support postfix formatter function', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const [variant] = await generateAll(generator, image, {
            width: [320],
            postfix: (width, _multiplier, format) => `-${width}.${format}`
          })

          expect(variant.path).toBe('/images/image-320.jpg.jpg')
          expect(variant.postfix).toBe('-320.jpg')
        })
      })

      describe('svg', () => {
        it('should pass svg through', async () => {
          const generator = new SrcSetGenerator()
          const icon = createSvg()
          const images = await generateAll(generator, icon, {
            width: [0.33, 0.66, 1]
          })

          expect(images.length).toBe(1)
          expect(images[0].format).toBe('svg')
          expect(images[0].contents).toBe(icon.contents)
          expect(images[0].path).toBe(icon.path)
        })

        it('should not emit svg from raster image', async () => {
          const generator = new SrcSetGenerator()
          const image = await createImage('jpg', 64, 64)
          const images = await generateAll(generator, image, {
            format: 'svg'
          })

          expect(images.length).toBe(0)
        })

        it('should not emit raster formats from svg', async () => {
          const generator = new SrcSetGenerator()
          const icon = createSvg()
          const images = await generateAll(generator, icon, {
            format: ['jpg', 'webp', 'png']
          })

          expect(images.length).toBe(0)
        })

        it('should apply svg optimizer', async () => {
          const generator = new SrcSetGenerator({
            optimization: {
              svg: () => Buffer.from('<svg/>')
            }
          })
          const icon = createSvg()
          const [variant] = await generateAll(generator, icon)

          expect(variant.contents.toString()).toBe('<svg/>')
        })
      })

      describe('gif', () => {
        it('should resize animated gif preserving frames', async () => {
          const generator = new SrcSetGenerator()
          const animation = await createAnimatedImage(64, 64, 3)
          const [variant] = await generateAll(generator, animation, {
            width: [32]
          })
          const metadata = await sharp(variant.contents, {
            animated: true
          }).metadata()

          expect(variant.format).toBe('gif')
          expect(variant.width).toBe(32)
          expect(variant.height).toBe(32)
          expect(metadata.pages).toBe(3)
        })

        it('should convert animated gif to animated webp', async () => {
          const generator = new SrcSetGenerator()
          const animation = await createAnimatedImage(64, 64, 3)
          const [variant] = await generateAll(generator, animation, {
            format: 'webp'
          })
          const metadata = await sharp(variant.contents, {
            animated: true
          }).metadata()

          expect(variant.format).toBe('webp')
          expect(metadata.format).toBe('webp')
          expect(metadata.pages).toBe(3)
        })

        it('should convert gif to static jpg', async () => {
          const generator = new SrcSetGenerator()
          const animation = await createAnimatedImage(64, 64, 3)
          const [variant] = await generateAll(generator, animation, {
            format: 'jpg'
          })
          const metadata = await sharp(variant.contents).metadata()

          expect(variant.format).toBe('jpg')
          expect(metadata.format).toBe('jpeg')
          expect(metadata.width).toBe(64)
          expect(metadata.height).toBe(64)
        })

        it('should pass gif through when optimization is skipped', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const animation = await createAnimatedImage(64, 64, 3)
          const [variant] = await generateAll(generator, animation)

          expect(variant.contents).toBe(animation.contents)
        })
      })

      describe('concurrency', () => {
        it('should work with concurrency 1', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true,
            concurrency: 1
          })
          const image = await createImage('jpg')
          const images = await generateAll(generator, image, {
            width: [60, 120, 320]
          })

          expect(images.length).toBe(3)
        })
      })

      describe('cache', () => {
        it('should reuse stored variants between generators', async () => {
          const dir = await mkdtemp(path.join(tmpdir(), 'srcset-generator-cache-'))
          const cache = new SrcSetCacheStorage({
            dir
          })
          const image = await createImage('jpg')
          const options: GenerateOptions = {
            width: [1, 0.5],
            format: ['webp', 'jpg']
          }
          const generated = await generateAll(new SrcSetGenerator({
            skipOptimization: true,
            cache
          }), image, options)
          const cached = await generateAll(new SrcSetGenerator({
            skipOptimization: true,
            cache
          }), image, options)

          expect(generated.length).toBe(4)
          expect(cached).toEqual(generated)

          const files = (await readdir(dir)).filter(name => !name.endsWith('.json'))

          expect(files.length).toBe(4)
        })
      })

      describe('orientation', () => {
        it('should rotate the pixels of an oriented source', async () => {
          const generator = new SrcSetGenerator()
          const image = await createOrientedImage()
          const [variant] = await generateAll(generator, image, {
            width: [0.5]
          })
          const metadata = await sharp(variant.contents).metadata()

          expect(variant.width).toBe(fixtureHeight / 2)
          expect(variant.height).toBe(fixtureWidth / 2)
          expect(metadata.width).toBe(fixtureHeight / 2)
          expect(metadata.height).toBe(fixtureWidth / 2)
          expect(metadata.orientation).toBeUndefined()
        })

        it('should keep every variant of an oriented source in one orientation', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createOrientedImage()
          const images = await generateAll(generator, image, {
            width: [1, 0.5]
          })
          const rendered = await Promise.all(images.map(async ({ contents }) => {
            const {
              width,
              height,
              orientation
            } = await sharp(contents).metadata()

            // A browser applies the tag: transposed for orientation 6.
            return orientation === 6 ? width < height : width > height
          }))

          expect(images.length).toBe(2)
          expect(rendered).toEqual([false, false])
          expect(images.map(({ width }) => width)).toEqual([fixtureHeight, fixtureHeight / 2])
        })
      })

      describe('generateAll', () => {
        it('should apply the first matching rule only', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = []

          for await (const generated of generator.generateAll(image, [
            {
              match: '**/*.png',
              width: [0.25]
            },
            {
              width: [0.5]
            },
            {
              width: [0.75]
            }
          ])) {
            images.push(generated)
          }

          expect(images.map(({ path }) => path)).toEqual(['/images/image@320w.jpg'])
        })

        it('should keep matching after a fallthrough rule', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = []

          for await (const generated of generator.generateAll(image, [
            {
              fallthrough: true,
              width: [0.5]
            },
            {
              width: [0.25]
            }
          ])) {
            images.push(generated)
          }

          expect(images.map(({ path }) => path)).toEqual([
            '/images/image@320w.jpg',
            '/images/image@160w.jpg'
          ])
        })

        it('should produce a file of overlapping rules once', async () => {
          const generator = new SrcSetGenerator({
            skipOptimization: true
          })
          const image = await createImage('jpg')
          const images = []

          for await (const generated of generator.generateAll(image, [
            {
              fallthrough: true,
              width: [0.5, 1]
            },
            {
              width: [320, 0.25]
            }
          ])) {
            images.push(generated)
          }

          expect(images.map(({ path }) => path)).toEqual([
            '/images/image@320w.jpg',
            '/images/image.jpg',
            '/images/image@160w.jpg'
          ])
        })
      })
    })
  })
})
