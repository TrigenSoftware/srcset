import {
  Image,
  Picture
} from '@srcset/react'
// The rule lives in the import query and overrides the rules from the loader options.
import * as miguelImage from './images/miguel.jpg?{ "width": [1, 0.5, 0.25], "format": ["avif", "webp", "jpg"] }'
// `?placeholder` adds the blur-up data-url export for this import only.
import * as felixImage from './images/felix.jpg?placeholder'
// Both use the matching rules from the loader options.
import * as miguelSticker from './images/miguel-sticker.png'
import * as animation from './images/animation.gif'
import { DemoSection } from './DemoSection.jsx'

// The page is a single column, so one `sizes` fits every demo.
const sizes = '(max-width: 46rem) 100vw, 46rem'

/**
 * The demo page: four sections built from `Picture` and `Image`.
 * @returns Sections of the page.
 */
export function App() {
  return (
    <>
      {/* 1. Widths and formats from the import query, rendered as a `<picture>`. */}
      <DemoSection
        title='1. Widths and formats from the import query'
        caption='miguel.jpg with the rule { width: [1, 0.5, 0.25], format: ["avif", "webp", "jpg"] } in the import query: Picture renders one <source> per format, ordered avif, webp, jpg by format efficiency.'
        srcSet={miguelImage.srcSet}
      >
        <Picture
          srcSet={miguelImage.srcSet}
          sizes={sizes}
        >
          <Image
            alt='Miguel the cat, in three widths and three formats'
            src={miguelImage.src}
            srcSet={miguelImage.srcSet}
            sizes={sizes}
          />
        </Picture>
      </DemoSection>

      {/* 2. Blur-up placeholder, and the only place where `priority` is correct. */}
      <DemoSection
        title='2. Blur-up placeholder and priority'
        caption='felix.jpg imported with ?placeholder: Image shows the tiny data-url as its background until the full image loads. `priority` makes it eager, high priority and preloaded - correct here only because this Image is not inside a Picture.'
        srcSet={felixImage.srcSet}
      >
        <Image
          alt='Felix the cat, with a blur-up placeholder'
          src={felixImage.src}
          srcSet={felixImage.srcSet}
          placeholder={felixImage.placeholder}
          sizes={sizes}
          priority
        />
      </DemoSection>

      {/* 3. Png keeps transparency, webp is added next to it. */}
      <DemoSection
        title='3. Transparency survives'
        caption='miguel-sticker.png with the rule { format: ["png", "webp"] } from the loader options: both formats keep the alpha channel, so the checkerboard behind the sticker shows through.'
        srcSet={miguelSticker.srcSet}
      >
        <Picture
          className='checkerboard'
          srcSet={miguelSticker.srcSet}
          sizes={sizes}
        >
          <Image
            alt='Miguel sticker with a transparent background'
            src={miguelSticker.src}
            srcSet={miguelSticker.srcSet}
            sizes={sizes}
          />
        </Picture>
      </DemoSection>

      {/* 4. Gif keeps every frame, animated webp is added next to it. */}
      <DemoSection
        title='4. Animation survives'
        caption='animation.gif with the rule { format: ["gif", "webp"] } from the loader options: all 50 frames are kept in both the gif and the animated webp variants, so the animation plays.'
        srcSet={animation.srcSet}
      >
        <Picture
          srcSet={animation.srcSet}
          sizes={sizes}
        >
          <Image
            alt='Animated image'
            src={animation.src}
            srcSet={animation.srcSet}
            sizes={sizes}
          />
        </Picture>
      </DemoSection>
    </>
  )
}
