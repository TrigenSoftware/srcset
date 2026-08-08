import {
  describe,
  it,
  expect
} from 'vitest'
import { Buffer } from 'node:buffer'
import {
  buildImgproxyUrl,
  createDefaultProcessing
} from './url.ts'

const variant = {
  format: 'webp',
  width: 320,
  height: 240
} as const

describe('imgproxy', () => {
  describe('url', () => {
    describe('createDefaultProcessing', () => {
      it('should build width and format options', () => {
        expect(createDefaultProcessing()(variant)).toBe('w:320/f:webp')
      })

      it('should add quality option', () => {
        expect(createDefaultProcessing(80)(variant)).toBe('w:320/f:webp/q:80')
      })
    })

    describe('buildImgproxyUrl', () => {
      it('should build insecure url with base64-encoded source', () => {
        expect(buildImgproxyUrl(
          'https://imgproxy.example.com',
          'w:320/f:webp',
          'https://cdn.example.com/photo.jpg'
        )).toBe(
          `https://imgproxy.example.com/insecure/w:320/f:webp/${Buffer.from('https://cdn.example.com/photo.jpg').toString('base64url')}`
        )
      })

      it('should trim trailing slash of the endpoint', () => {
        expect(buildImgproxyUrl(
          'https://imgproxy.example.com/',
          'w:320/f:webp',
          'https://cdn.example.com/photo.jpg'
        )).toBe(
          `https://imgproxy.example.com/insecure/w:320/f:webp/${Buffer.from('https://cdn.example.com/photo.jpg').toString('base64url')}`
        )
      })

      it('should base64-encode non-ascii source url', () => {
        expect(buildImgproxyUrl(
          'https://imgproxy.example.com',
          'w:320/f:webp',
          'https://cdn.example.com/\u0444\u043e\u0442\u043e.jpg?v=2'
        )).toBe(
          `https://imgproxy.example.com/insecure/w:320/f:webp/${Buffer.from('https://cdn.example.com/\u0444\u043e\u0442\u043e.jpg?v=2').toString('base64url')}`
        )
      })

      it('should sign the path with given signer', () => {
        const source = Buffer.from('https://cdn.example.com/photo.jpg').toString('base64url')

        expect(buildImgproxyUrl(
          'https://imgproxy.example.com',
          'w:320/f:webp',
          'https://cdn.example.com/photo.jpg',
          path => `signed:${path.length}`
        )).toBe(`https://imgproxy.example.com/signed:${`/w:320/f:webp/${source}`.length}/w:320/f:webp/${source}`)
      })
    })
  })
})
