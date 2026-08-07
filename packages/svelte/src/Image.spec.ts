import {
  describe,
  it,
  expect,
  vi
} from 'vitest'
import {
  render,
  screen,
  fireEvent
} from '@testing-library/svelte'
import Image from './Image.svelte'
import RefHolder from '../test/RefHolder.svelte'
import {
  createSrc,
  createSrcSet
} from '../test/src.mock.ts'

describe('svelte', () => {
  describe('Image', () => {
    it('should render img from variant with intrinsic size', () => {
      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640, 480)
        }
      })

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('src', '/images/image@640w.jpg')
      expect(image).toHaveAttribute('width', '640')
      expect(image).toHaveAttribute('height', '480')
    })

    it('should build srcset from variants of src format', () => {
      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640),
          srcSet: [
            ...createSrcSet('jpg', [320, 640]),
            ...createSrcSet('webp', [320, 640])
          ]
        }
      })

      expect(screen.getByAltText('photo')).toHaveAttribute(
        'srcset',
        '/images/image@320w.jpg 320w, /images/image@640w.jpg 640w'
      )
    })

    it('should accept srcset string as is', () => {
      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640),
          srcSet: 'custom 2x'
        }
      })

      expect(screen.getByAltText('photo')).toHaveAttribute('srcset', 'custom 2x')
    })

    it('should override intrinsic size with props', () => {
      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640, 480),
          width: 100,
          height: 75
        }
      })

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('width', '100')
      expect(image).toHaveAttribute('height', '75')
    })

    it('should not fill the other dimension for a single override', () => {
      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640, 480),
          width: 100
        }
      })

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('width', '100')
      expect(image).not.toHaveAttribute('height')
    })

    it('should drop placeholder for an image completed before hydration', () => {
      const complete = vi.spyOn(window.HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
      const naturalWidth = vi.spyOn(window.HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(640)

      try {
        render(Image, {
          props: {
            alt: 'photo',
            src: createSrc('jpg', 640),
            placeholder: 'data:image/webp;base64,abc'
          }
        })

        const image = screen.getByAltText('photo')

        expect(image).not.toHaveAttribute('data-loading')
        expect(image.style.backgroundImage).toBe('')
      } finally {
        complete.mockRestore()
        naturalWidth.mockRestore()
      }
    })

    it('should be lazy with async decoding by default', () => {
      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640)
        }
      })

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image).toHaveAttribute('decoding', 'async')
    })

    it('should load eagerly with high priority', () => {
      render(Image, {
        props: {
          alt: 'photo',
          priority: true,
          src: createSrc('jpg', 640),
          srcSet: createSrcSet('jpg', [320, 640])
        }
      })

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('loading', 'eager')
      expect(image).toHaveAttribute('fetchpriority', 'high')
    })

    it('should show placeholder background until load', async () => {
      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640),
          placeholder: 'data:image/webp;base64,abc'
        }
      })

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('data-loading')
      expect(image.style.backgroundImage).toBe('url("data:image/webp;base64,abc")')

      await fireEvent.load(image)

      expect(image).not.toHaveAttribute('data-loading')
      expect(image.style.backgroundImage).toBe('')
    })

    it('should call onload prop', async () => {
      const onload = vi.fn()

      render(Image, {
        props: {
          alt: 'photo',
          src: createSrc('jpg', 640),
          onload
        }
      })

      await fireEvent.load(screen.getByAltText('photo'))

      expect(onload).toHaveBeenCalledOnce()
    })

    it('should bind ref to the img element and clear it on unmount', () => {
      const holder: { current: HTMLImageElement | null } = {
        current: null
      }
      const { unmount } = render(RefHolder, {
        props: {
          holder,
          src: createSrc('jpg', 640)
        }
      })

      expect(holder.current).toBeInstanceOf(HTMLImageElement)

      unmount()

      expect(holder.current).toBeNull()
    })

    it('should pass class through', () => {
      render(Image, {
        props: {
          alt: 'photo',
          class: 'hero',
          src: createSrc('jpg', 640)
        }
      })

      expect(screen.getByAltText('photo')).toHaveClass('hero')
    })
  })
})
