import {
  describe,
  it,
  expect
} from 'vitest'
import {
  type SrcSetModuleEntry,
  createModuleString
} from './module.ts'

function createEntry(
  format: 'jpg' | 'webp',
  width: number,
  originMultiplier: number | null = null
): SrcSetModuleEntry {
  return {
    id: `${format}${width}`,
    format,
    type: format === 'jpg' ? 'image/jpeg' : 'image/webp',
    width,
    height: Math.round(width * 0.75),
    originMultiplier,
    url: {
      outputPath: `image@${width}w.${format}`,
      publicPath: null,
      publicPathExpression: '__webpack_public_path__'
    }
  }
}

describe('bundler-utils', () => {
  describe('module', () => {
    describe('createModuleString', () => {
      it('should select default variant by format and width', () => {
        const module = createModuleString({
          select: {
            format: 'webp',
            width: 320
          },
          srcSet: [createEntry('jpg', 320), createEntry('webp', 320), createEntry('webp', 640)]
        })

        expect(module).toContain('const url = (__webpack_public_path__) + "image@320w.webp";')
      })

      it('should select default variant by multiplier', () => {
        const module = createModuleString({
          select: {
            format: 'jpg',
            width: 0.5
          },
          srcSet: [createEntry('jpg', 640, 1), createEntry('jpg', 320, 0.5)]
        })

        expect(module).toContain('const url = (__webpack_public_path__) + "image@320w.jpg";')
      })

      it('should select default variant by id', () => {
        const module = createModuleString({
          select: {
            id: 'webp640'
          },
          srcSet: [createEntry('jpg', 320), createEntry('webp', 640)]
        })

        expect(module).toContain('const url = (__webpack_public_path__) + "image@640w.webp";')
      })

      it('should fall back to first variant', () => {
        const module = createModuleString({
          select: {
            format: 'avif',
            width: 5000
          },
          srcSet: [createEntry('jpg', 320), createEntry('webp', 640)]
        })

        expect(module).toContain('const url = (__webpack_public_path__) + "image@320w.jpg";')
      })

      it('should create empty module without variants', () => {
        const module = createModuleString({
          select: {
            format: 'jpg',
            width: 640
          },
          srcSet: []
        })

        expect(module).toContain("const url = '';")
        expect(module).toContain('const src = null;')
        expect(module).toContain('export const srcSet = [];')
      })

      it('should reuse url and src references for default variant', () => {
        const module = createModuleString({
          select: {
            format: 'jpg',
            width: 320
          },
          srcSet: [createEntry('jpg', 320), createEntry('webp', 320)]
        })

        expect(module).toContain('url: url')
        expect(module).toContain('export const srcSet = [src, {')
        expect(module).toContain('"jpg320": url')
      })

      it('should emit placeholder export', () => {
        const module = createModuleString({
          select: {
            format: 'jpg',
            width: 320
          },
          srcSet: [createEntry('jpg', 320)],
          placeholder: 'data:image/webp;base64,abc'
        })

        expect(module).toContain('export const placeholder = "data:image/webp;base64,abc";')
      })

      it('should narrow the variant format for a typescript module', () => {
        const module = createModuleString({
          select: {},
          srcSet: [createEntry('jpg', 320)],
          typescript: true
        })

        expect(module).toContain('format: "jpg" as const,')
      })

      it('should emit undefined placeholder without data-url', () => {
        const module = createModuleString({
          select: {
            format: 'jpg',
            width: 320
          },
          srcSet: [createEntry('jpg', 320)]
        })

        expect(module).toContain('export const placeholder = undefined;')
      })

      it('should map ids to urls', () => {
        const module = createModuleString({
          select: {
            format: 'jpg',
            width: 320
          },
          srcSet: [createEntry('jpg', 320), createEntry('webp', 640)]
        })

        expect(module).toContain('"webp640": (__webpack_public_path__) + "image@640w.webp"')
      })
    })
  })
})
