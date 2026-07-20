import sharp from 'sharp'
import type { ImageSource } from '../src/types.ts'

export const fixtureWidth = 640
export const fixtureHeight = 480

const channels = 3
const colorDepth = 256
// Deterministic LCG, so fixtures are reproducible between runs.
let seed = 1

function createNoise(width: number, height: number) {
  const data = Buffer.alloc(width * height * channels)

  for (let i = 0; i < data.length; i++) {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    // The upper bits: the low LCG bits cycle with a short period.
    data[i] = Math.floor(seed / 16777216) % colorDepth
  }

  return data
}

function createNoisePipeline(width: number, height: number) {
  return sharp(createNoise(width, height), {
    raw: {
      width,
      height,
      channels
    }
  })
}

/**
 * Create a noise image fixture in memory.
 * @param format - Image format.
 * @param width - Image width.
 * @param height - Image height.
 * @returns Image file.
 */
export async function createImage(
  format: 'jpg' | 'png' | 'webp' | 'avif' = 'jpg',
  width = fixtureWidth,
  height = fixtureHeight
): Promise<ImageSource> {
  const pipeline = createNoisePipeline(width, height)

  switch (format) {
    case 'jpg':
      pipeline.jpeg({
        quality: 90
      })
      break

    case 'png':
      pipeline.png()
      break

    case 'webp':
      pipeline.webp()
      break

    case 'avif':
      pipeline.avif()
      break

    default:
      break
  }

  return {
    path: `/images/image.${format}`,
    contents: await pipeline.toBuffer()
  }
}

/**
 * Create an animated gif fixture in memory.
 * @param width - Frame width.
 * @param height - Frame height.
 * @param frames - Number of frames.
 * @returns Image file.
 */
export async function createAnimatedImage(width = 64, height = 64, frames = 3): Promise<ImageSource> {
  const frameBuffers = await Promise.all(
    Array.from({
      length: frames
    }, async () => createNoisePipeline(width, height).png().toBuffer())
  )
  const contents = await sharp(frameBuffers, {
    join: {
      animated: true
    }
  }).gif().toBuffer()

  return {
    path: '/images/animation.gif',
    contents
  }
}

/**
 * Create an SVG fixture in memory.
 * @param width - Image width.
 * @param height - Image height.
 * @returns Image file.
 */
export function createSvg(width = 60, height = 60): ImageSource {
  const contents = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#f00"/></svg>`
  )

  return {
    path: '/images/icon.svg',
    contents
  }
}
