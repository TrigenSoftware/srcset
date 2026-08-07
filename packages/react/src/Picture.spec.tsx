import {
  describe,
  it,
  expect
} from 'vitest'
import {
  render,
  screen
} from '@testing-library/react'
import { Picture } from './Picture.tsx'
import { Image } from './Image.tsx'
import {
  createSrc,
  createSrcSet
} from '../test/src.mock.ts'

const srcSet = [
  ...createSrcSet('jpg', [320, 640]),
  ...createSrcSet('webp', [320, 640]),
  ...createSrcSet('avif', [320, 640])
]

describe('react', () => {
  describe('Picture', () => {
    it('should render sources ordered by format efficiency', () => {
      const { container } = render(
        <Picture srcSet={srcSet}>
          <Image alt='photo'/>
        </Picture>
      )
      const sources = [...container.querySelectorAll('source')]

      expect(sources.map(source => source.type)).toEqual([
        'image/avif',
        'image/webp',
        'image/jpeg'
      ])
      expect(sources[0]).toHaveAttribute(
        'srcset',
        '/images/image@320w.avif 320w, /images/image@640w.avif 640w'
      )
    })

    it('should apply sizes to every source', () => {
      const { container } = render(
        <Picture
          srcSet={srcSet}
          sizes='(max-width: 600px) 100vw, 50vw'
        >
          <Image alt='photo'/>
        </Picture>
      )
      const sources = [...container.querySelectorAll('source')]

      expect(sources.length).toBeGreaterThan(0)
      sources.forEach((source) => {
        expect(source).toHaveAttribute('sizes', '(max-width: 600px) 100vw, 50vw')
      })
    })

    it('should render img child inside picture', () => {
      const { container } = render(
        <Picture srcSet={srcSet}>
          <Image
            alt='photo'
            src={createSrc('jpg', 640)}
          />
        </Picture>
      )
      const image = screen.getByAltText('photo')

      expect(image.closest('picture')).toBe(container.querySelector('picture'))
      expect(image).toHaveAttribute('src', '/images/image@640w.jpg')
    })

    it('should pass picture attributes through', () => {
      const { container } = render(
        <Picture
          className='hero'
          srcSet={srcSet}
        >
          <Image alt='photo'/>
        </Picture>
      )

      expect(container.querySelector('picture')).toHaveClass('hero')
    })
  })
})
