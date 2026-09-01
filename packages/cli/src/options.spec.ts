import {
  describe,
  it,
  expect
} from 'vitest'
import type { CliArgs } from './args.ts'
import {
  toModuleFormat,
  toCliOptions
} from './options.ts'

const noArgs: CliArgs = {
  help: false,
  verbose: undefined,
  sources: [],
  rule: null,
  skipOptimization: undefined,
  scalingUp: undefined,
  dest: undefined,
  module: undefined,
  placeholder: undefined,
  placeholderWidth: undefined,
  placeholderFormat: undefined,
  selectId: undefined,
  selectFormat: undefined,
  selectWidth: undefined,
  config: undefined,
  concurrency: undefined
}

describe('cli', () => {
  describe('options', () => {
    describe('toModuleFormat', () => {
      it('should pass a known format through', () => {
        expect(toModuleFormat('js-dir')).toBe('js-dir')
      })

      it('should allow no format', () => {
        expect(toModuleFormat(undefined)).toBeUndefined()
      })

      it('should reject an unknown format', () => {
        expect(() => toModuleFormat('typescript')).toThrow('Unknown module format: "typescript"')
      })
    })

    describe('toCliOptions', () => {
      it('should prefer the arguments over the config', () => {
        const options = toCliOptions({
          ...noArgs,
          sources: ['images/*.png'],
          dest: 'build',
          module: 'js',
          verbose: true
        }, {
          src: 'images/*.jpg',
          dest: 'dist',
          module: 'ts-dir',
          verbose: false
        })

        expect(options.src).toEqual(['images/*.png'])
        expect(options.dest).toBe('build')
        expect(options.module).toBe('js')
        expect(options.verbose).toBe(true)
      })

      it('should fall back to the config', () => {
        const options = toCliOptions(noArgs, {
          src: 'images/*.jpg',
          dest: 'dist',
          module: 'ts-dir',
          concurrency: 2
        })

        expect(options.src).toBe('images/*.jpg')
        expect(options.dest).toBe('dist')
        expect(options.module).toBe('ts-dir')
        expect(options.concurrency).toBe(2)
      })

      it('should keep a negated flag of the arguments', () => {
        expect(toCliOptions({
          ...noArgs,
          scalingUp: false
        }, {
          src: 'images/*.jpg',
          dest: 'dist',
          scalingUp: true
        }).scalingUp).toBe(false)
      })

      it('should validate the module format of the config', () => {
        expect(() => toCliOptions(noArgs, {
          src: 'images/*.jpg',
          dest: 'dist',
          module: 'typescript' as never
        })).toThrow('Unknown module format: "typescript"')
      })

      it('should switch the placeholder on', () => {
        expect(toCliOptions({
          ...noArgs,
          placeholder: true
        }, {
          src: 'images/*.jpg',
          dest: 'dist'
        }).placeholder).toBe(true)
      })

      it('should read the placeholder options', () => {
        expect(toCliOptions({
          ...noArgs,
          placeholderWidth: 24,
          placeholderFormat: 'jpg'
        }, {
          src: 'images/*.jpg',
          dest: 'dist'
        }).placeholder).toEqual({
          width: 24,
          format: 'jpg'
        })
      })

      it('should let the placeholder options switch the placeholder on', () => {
        expect(toCliOptions({
          ...noArgs,
          placeholderWidth: 24
        }, {
          src: 'images/*.jpg',
          dest: 'dist'
        }).placeholder).toEqual({
          width: 24
        })
      })

      it('should keep the negated placeholder off', () => {
        expect(toCliOptions({
          ...noArgs,
          placeholder: false,
          placeholderWidth: 24
        }, {
          src: 'images/*.jpg',
          dest: 'dist',
          placeholder: true
        }).placeholder).toBe(false)
      })

      it('should reject an unknown placeholder format', () => {
        expect(() => toCliOptions({
          ...noArgs,
          placeholderFormat: 'png'
        }, {
          src: 'images/*.jpg',
          dest: 'dist'
        })).toThrow('Unknown placeholder format: "png"')
      })

      it('should fall back to the placeholder of the config', () => {
        expect(toCliOptions(noArgs, {
          src: 'images/*.jpg',
          dest: 'dist',
          placeholder: {
            width: 8
          }
        }).placeholder).toEqual({
          width: 8
        })
      })

      it('should read the selection of the default export', () => {
        expect(toCliOptions({
          ...noArgs,
          selectFormat: 'webp',
          selectWidth: 640
        }, {
          src: 'images/*.jpg',
          dest: 'dist'
        }).select).toEqual({
          format: 'webp',
          width: 640
        })
      })

      it('should replace the selection of the config', () => {
        expect(toCliOptions({
          ...noArgs,
          selectId: 'jpg640'
        }, {
          src: 'images/*.jpg',
          dest: 'dist',
          select: {
            format: 'avif'
          }
        }).select).toEqual({
          id: 'jpg640'
        })
      })

      it('should throw without sources', () => {
        expect(() => toCliOptions(noArgs, {
          dest: 'dist'
        })).toThrow('No source images')
      })

      it('should throw without a destination', () => {
        expect(() => toCliOptions(noArgs, {
          src: 'images/*.jpg'
        })).toThrow('No destination directory')
      })
    })
  })
})
