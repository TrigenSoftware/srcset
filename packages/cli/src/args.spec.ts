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
    })
  })
})
