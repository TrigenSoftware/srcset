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
} from '@testing-library/react'
import { createRef } from 'react'
import { Image } from './Image.tsx'
import {
  createSrc,
  createSrcSet
} from '../test/src.mock.ts'

describe('react', () => {
  describe('Image', () => {
    it('should render img from variant with intrinsic size', () => {
      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640, 480)}
        />
      )

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('src', '/images/image@640w.jpg')
      expect(image).toHaveAttribute('width', '640')
      expect(image).toHaveAttribute('height', '480')
    })

    it('should build srcset from variants of src format', () => {
      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640)}
          srcSet={[
            ...createSrcSet('jpg', [320, 640]),
            ...createSrcSet('webp', [320, 640])
          ]}
        />
      )

      expect(screen.getByAltText('photo')).toHaveAttribute(
        'srcset',
        '/images/image@320w.jpg 320w, /images/image@640w.jpg 640w'
      )
    })

    it('should accept srcset string as is', () => {
      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640)}
          srcSet='custom 2x'
        />
      )

      expect(screen.getByAltText('photo')).toHaveAttribute('srcset', 'custom 2x')
    })

    it('should override intrinsic size with props', () => {
      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640, 480)}
          width={100}
          height={75}
        />
      )

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('width', '100')
      expect(image).toHaveAttribute('height', '75')
    })

    it('should not fill the other dimension for a single override', () => {
      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640, 480)}
          width={100}
        />
      )

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('width', '100')
      expect(image).not.toHaveAttribute('height')
    })

    it('should be lazy with async decoding by default', () => {
      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640)}
        />
      )

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image).toHaveAttribute('decoding', 'async')
    })

    it('should load eagerly with high priority', () => {
      render(
        <Image
          alt='photo'
          priority
          sizes='100vw'
          crossOrigin='anonymous'
          referrerPolicy='no-referrer'
          src={createSrc('jpg', 640)}
          srcSet={createSrcSet('jpg', [320, 640])}
        />
      )

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('loading', 'eager')
      expect(image).toHaveAttribute('fetchpriority', 'high')
    })

    it('should show placeholder background until load', () => {
      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640)}
          placeholder='data:image/webp;base64,abc'
        />
      )

      const image = screen.getByAltText('photo')

      expect(image).toHaveAttribute('data-loading')
      expect(image.style.backgroundImage).toBe('url("data:image/webp;base64,abc")')

      fireEvent.load(image)

      expect(image).not.toHaveAttribute('data-loading')
      expect(image.style.backgroundImage).toBe('')
    })

    it('should drop placeholder for an image completed before hydration', () => {
      const complete = vi.spyOn(window.HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
      const naturalWidth = vi.spyOn(window.HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(640)

      try {
        render(
          <Image
            alt='photo'
            src={createSrc('jpg', 640)}
            placeholder='data:image/webp;base64,abc'
          />
        )

        const image = screen.getByAltText('photo')

        expect(image).not.toHaveAttribute('data-loading')
        expect(image.style.backgroundImage).toBe('')
      } finally {
        complete.mockRestore()
        naturalWidth.mockRestore()
      }
    })

    it('should run callback ref cleanup on unmount', () => {
      const cleanup = vi.fn()
      const refCallback = vi.fn(() => cleanup)
      const { unmount } = render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640)}
          ref={refCallback}
        />
      )

      expect(refCallback).toHaveBeenCalledOnce()

      unmount()

      expect(cleanup).toHaveBeenCalledOnce()
      // With a cleanup returned, React must not call the ref with `null`.
      expect(refCallback).toHaveBeenCalledOnce()
    })

    it('should call onLoad prop', () => {
      const onLoad = vi.fn()

      render(
        <Image
          alt='photo'
          src={createSrc('jpg', 640)}
          onLoad={onLoad}
        />
      )

      fireEvent.load(screen.getByAltText('photo'))

      expect(onLoad).toHaveBeenCalledOnce()
    })

    it('should pass class and ref through', () => {
      const ref = createRef<HTMLImageElement>()

      render(
        <Image
          alt='photo'
          className='hero'
          ref={ref}
          src={createSrc('jpg', 640)}
        />
      )

      expect(screen.getByAltText('photo')).toHaveClass('hero')
      expect(ref.current).toBeInstanceOf(HTMLImageElement)
    })
  })
})
