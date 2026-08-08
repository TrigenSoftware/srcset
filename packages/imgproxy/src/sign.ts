import { Buffer } from 'node:buffer'
import { createHmac } from 'node:crypto'
import type { ImgproxySigner } from './types.ts'

const HEX_PATTERN = /^(?:[\da-f]{2})+$/i

export interface ImgproxySignerOptions {
  /**
   * Hex-encoded imgproxy key.
   */
  key: string
  /**
   * Hex-encoded imgproxy salt.
   */
  salt: string
}

/**
 * Decode a hex string, rejecting input that `Buffer.from` would silently truncate.
 * @param name - Option name for the error message.
 * @param value - Hex string.
 * @returns Decoded bytes.
 */
function decodeHex(name: string, value: string) {
  if (!HEX_PATTERN.test(value)) {
    throw new TypeError(`The imgproxy signer needs a non-empty hex-encoded ${name}.`)
  }

  return Buffer.from(value, 'hex')
}

/**
 * Create an imgproxy url path signer: HMAC-SHA256 of the salted path.
 * Server side only - never expose the key and the salt to the browser.
 * @param options - Hex-encoded key and salt.
 * @returns Url path signer.
 */
export function sign(options: ImgproxySignerOptions): ImgproxySigner {
  const key = decodeHex('key', options.key)
  const salt = decodeHex('salt', options.salt)

  return path => createHmac('sha256', key)
    .update(salt)
    .update(path)
    .digest('base64url')
}
