import {
  mkdtemp,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import type { SrcSetEntry } from '@srcset/runtime'

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
  const dir = await mkdtemp(path.join(tmpdir(), 'srcset-vite-'))
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
