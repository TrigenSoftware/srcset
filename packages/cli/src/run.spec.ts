import {
  mkdir,
  mkdtemp,
  readdir,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import {
  describe,
  it,
  expect
} from 'vitest'
import sharp from 'sharp'
import { run } from './run.ts'

async function createProject() {
  const dir = await mkdtemp(join(tmpdir(), 'srcset-cli-'))
  const contents = await sharp({
    create: {
      width: 640,
      height: 480,
      channels: 3,
      background: '#3a7bd5'
    }
  }).jpeg().toBuffer()

  await mkdir(join(dir, 'images'))
  await writeFile(join(dir, 'images/photo.jpg'), contents)

  return dir
}

async function runIn(dir: string, options: Parameters<typeof run>[0]) {
  const cwd = process.cwd()

  process.chdir(dir)

  try {
    return await run(options)
  } finally {
    process.chdir(cwd)
  }
}

describe('cli', () => {
  describe('run', () => {
    it('should generate variants to the destination directory', async () => {
      const dir = await createProject()
      const written = await runIn(dir, {
        src: 'images/**/*.jpg',
        dest: 'dist',
        skipOptimization: true,
        rules: [
          {
            width: [1, 0.5],
            format: ['webp', 'jpg']
          }
        ]
      })

      expect(written.length).toBe(4)
      expect((await readdir(join(dir, 'dist/images'))).sort()).toEqual([
        'photo.jpg',
        'photo.webp',
        'photo@320w.jpg',
        'photo@320w.webp'
      ])
    })

    it('should skip rules not matching the image', async () => {
      const dir = await createProject()
      const written = await runIn(dir, {
        src: 'images/**/*.jpg',
        dest: 'dist',
        skipOptimization: true,
        rules: [
          {
            match: '**/*.png',
            width: [0.5]
          }
        ]
      })

      expect(written).toEqual([])
    })

    it('should stop after the first matched rule', async () => {
      const dir = await createProject()
      const written = await runIn(dir, {
        src: 'images/**/*.jpg',
        dest: 'dist',
        skipOptimization: true,
        rules: [
          {
            width: [0.5]
          },
          {
            width: [0.25]
          }
        ]
      })

      expect(written.length).toBe(1)
      expect(written[0]).toContain('photo@320w.jpg')
    })

    it('should keep matching after a fallthrough rule', async () => {
      const dir = await createProject()
      const written = await runIn(dir, {
        src: 'images/**/*.jpg',
        dest: 'dist',
        skipOptimization: true,
        rules: [
          {
            fallthrough: true,
            width: [0.5]
          },
          {
            width: [0.25]
          }
        ]
      })

      expect(written.length).toBe(2)
      expect(written.some(file => file.includes('photo@320w.jpg'))).toBe(true)
      expect(written.some(file => file.includes('photo@160w.jpg'))).toBe(true)
    })

    it('should write a variant of overlapping fallthrough rules once', async () => {
      const dir = await createProject()
      const written = await runIn(dir, {
        src: 'images/**/*.jpg',
        dest: 'dist',
        skipOptimization: true,
        rules: [
          {
            fallthrough: true,
            width: [0.5]
          },
          {
            width: [0.5, 0.25]
          }
        ]
      })

      expect(written.length).toBe(2)
      expect(new Set(written).size).toBe(2)
    })

    it('should throw on an output path collision', async () => {
      const dir = await createProject()
      const contents = await sharp({
        create: {
          width: 320,
          height: 240,
          channels: 3,
          background: '#d53a7b'
        }
      }).jpeg().toBuffer()

      await mkdir(join(dir, 'other'))
      await writeFile(join(dir, 'other/photo.jpg'), contents)

      // Both sources sit outside the cwd, so both keep the file name only.
      await expect(runIn(join(dir, 'images'), {
        src: [join(dir, 'images/photo.jpg'), join(dir, 'other/photo.jpg')],
        dest: 'dist',
        skipOptimization: true,
        rules: [{
          width: [1]
        }]
      })).rejects.toThrow('collision')
    })

    it('should throw without matched sources', async () => {
      const dir = await createProject()

      await expect(runIn(dir, {
        src: 'images/**/*.gif',
        dest: 'dist'
      })).rejects.toThrow('No source images')
    })
  })
})
