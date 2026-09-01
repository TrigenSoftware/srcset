import {
  describe,
  it,
  expect
} from 'vitest'
import { setArgs } from 'argue-cli'
import { parseCliArgs } from './args.ts'

describe('cli', () => {
  describe('args', () => {
    describe('parseCliArgs', () => {
      it('should reject an unrecognised option', () => {
        setArgs('images/**/*.jpg', '--formats', 'webp', '--dest', 'dist')

        expect(() => parseCliArgs()).toThrow('Unknown option: "--formats"')
      })

      it('should parse sources and options', () => {
        setArgs(
          'images/**/*.jpg',
          '--dest',
          'dist',
          '--verbose',
          '--skip-optimization',
          '--concurrency',
          '2'
        )

        const args = parseCliArgs()

        expect(args.sources).toEqual(['images/**/*.jpg'])
        expect(args.dest).toBe('dist')
        expect(args.verbose).toBe(true)
        expect(args.skipOptimization).toBe(true)
        expect(args.concurrency).toBe(2)
        expect(args.help).toBe(false)
        expect(args.rule).toBeNull()
      })

      it('should build rule from match, width and format', () => {
        setArgs(
          '-m',
          '**/*.jpg',
          '-w',
          '1,0.5',
          '-f',
          'webp',
          '-f',
          'jpg'
        )

        expect(parseCliArgs().rule).toEqual({
          match: ['**/*.jpg'],
          width: [1, 0.5],
          format: ['webp', 'jpg']
        })
      })

      it('should keep a brace glob of the match option in one piece', () => {
        setArgs('-m', '**/*.{jpg,png}')

        expect(parseCliArgs().rule).toEqual({
          match: ['**/*.{jpg,png}']
        })
      })

      it('should collect the repeated match options', () => {
        setArgs('-m', '**/*.jpg', '-m', '(min-width: 1000px)')

        expect(parseCliArgs().rule).toEqual({
          match: ['**/*.jpg', '(min-width: 1000px)']
        })
      })

      it('should support camelCase twins and negation', () => {
        setArgs('--skipOptimization', '--no-scalingUp')

        const args = parseCliArgs()

        expect(args.skipOptimization).toBe(true)
        expect(args.scalingUp).toBe(false)
      })

      it('should parse help flag', () => {
        setArgs('-h')

        expect(parseCliArgs().help).toBe(true)
      })

      it('should read the placeholder and select options', () => {
        setArgs(
          '--placeholder-width',
          '24',
          '--placeholder-format',
          'jpg',
          '--select-format',
          'webp',
          '--select-width',
          '640'
        )

        const args = parseCliArgs()

        expect(args.placeholderWidth).toBe(24)
        expect(args.placeholderFormat).toBe('jpg')
        expect(args.selectFormat).toBe('webp')
        expect(args.selectWidth).toBe(640)
      })

      it('should read the negated placeholder flag', () => {
        setArgs('--no-placeholder')

        expect(parseCliArgs().placeholder).toBe(false)
      })

      it('should read the module format without validating it', () => {
        setArgs('--module', 'typescript')

        expect(parseCliArgs().module).toBe('typescript')
      })
    })
  })
})
