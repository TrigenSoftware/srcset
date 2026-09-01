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
