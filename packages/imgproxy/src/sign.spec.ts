import {
  describe,
  it,
  expect
} from 'vitest'
import { sign } from './sign.ts'
import { buildImgproxyUrl } from './url.ts'

const signer = sign({
  key: '943b421c9eb07c830af81030552c86009268de4e532ba2ee2eab8247c6da0881',
  salt: '520f986b998545b4785e0defbc4f3c1203f22de2374a3d53cb7a7fe9fea309c5'
})

describe('imgproxy', () => {
  describe('sign', () => {
    it('should sign path with hmac sha256 of salted path', () => {
      expect(signer('/w:320/f:webp/aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20vcGhvdG8uanBn')).toBe(
        '8u-9XHPfYQr3LUxk71Wj-k4IvCoA68dMhU26199tQ80'
      )
    })

    it('should throw on malformed key or salt', () => {
      expect(() => sign({
        key: '',
        salt: '520f'
      })).toThrow(TypeError)
      expect(() => sign({
        key: '943b421',
        salt: '520f'
      })).toThrow(TypeError)
      expect(() => sign({
        key: 'not-hex!',
        salt: '520f'
      })).toThrow(TypeError)
      expect(() => sign({
        key: '943b',
        salt: '520g'
      })).toThrow(TypeError)
    })

    it('should sign url built with buildImgproxyUrl', () => {
      expect(buildImgproxyUrl(
        'https://imgproxy.example.com',
        'w:320/f:webp',
        'https://cdn.example.com/photo.jpg',
        signer
      )).toBe(
        'https://imgproxy.example.com/8u-9XHPfYQr3LUxk71Wj-k4IvCoA68dMhU26199tQ80/w:320/f:webp/aHR0cHM6Ly9jZG4uZXhhbXBsZS5jb20vcGhvdG8uanBn'
      )
    })
  })
})
