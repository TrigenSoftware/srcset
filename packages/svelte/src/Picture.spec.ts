import {
  describe,
  it,
  expect
} from 'vitest'
import {
  render,
  screen
} from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import Picture from './Picture.svelte'
import { createSrcSet } from '../test/src.mock.ts'

const srcSet = [
  ...createSrcSet('jpg', [320, 640]),
  ...createSrcSet('webp', [320, 640]),
  ...createSrcSet('avif', [320, 640])
]
const image = createRawSnippet(() => ({
  render: () => '<img alt="photo" src="/images/image@640w.jpg"/>'
}))

describe('svelte', () => {
  describe('Picture', () => {
    it('should render sources ordered by format efficiency', () => {
      const { container } = render(Picture, {
        props: {
          srcSet,
          children: image
        }
      })
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
      const { container } = render(Picture, {
        props: {
          srcSet,
          sizes: '(max-width: 600px) 100vw, 50vw',
          children: image
        }
      })
      const sources = [...container.querySelectorAll('source')]

      expect(sources.length).toBeGreaterThan(0)
      sources.forEach((source) => {
        expect(source).toHaveAttribute('sizes', '(max-width: 600px) 100vw, 50vw')
      })
    })

    it('should render img child inside picture', () => {
      const { container } = render(Picture, {
        props: {
          srcSet,
          children: image
        }
      })
      const img = screen.getByAltText('photo')

      expect(img.closest('picture')).toBe(container.querySelector('picture'))
      expect(img).toHaveAttribute('src', '/images/image@640w.jpg')
    })

    it('should pass picture attributes through', () => {
      const { container } = render(Picture, {
        props: {
          srcSet,
          class: 'hero',
          children: image
        }
      })

      expect(container.querySelector('picture')).toHaveClass('hero')
    })
  })
})
