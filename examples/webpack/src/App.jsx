import {
  Image,
  Picture
} from '@srcset/preact'
// 1. A rule in the import query replaces the rule set from `webpack.config.js`.
import * as miguelImage from './images/miguel.jpg?{"width":[1,0.5,0.25],"format":["avif","webp","jpg"]}'
// 2. `?placeholder` adds the blur-up data-url export for this import only.
import * as felixImage from './images/felix.jpg?placeholder'
// 3 and 4 use the matching rules from `webpack.config.js`.
import * as miguelSticker from './images/miguel-sticker.png'
import * as animation from './images/animation.gif'
import { Demo } from './Demo.jsx'

// The `<img>` and every generated `<source>` share the same `sizes`.
const sizes = '(max-width: 48rem) 100vw, 48rem'

/**
 * The demo page: four image imports, each rendered by the components
 * of `@srcset/preact` from the variants the loader generated.
 * @returns Page content.
 */
export function App() {
  return (
    <>
      <Demo
        title='1. <picture> from an import query rule'
        caption={'miguel.jpg imported with ?{"width":[1,0.5,0.25],"format":["avif","webp","jpg"]}. '
          + '<Picture> renders one <source> per format, ordered by efficiency; <Image> renders the fallback <img>.'}
        srcSet={miguelImage.srcSet}
      >
        <Picture
          srcSet={miguelImage.srcSet}
          sizes={sizes}
        >
          <Image
            src={miguelImage.src}
            srcSet={miguelImage.srcSet}
            sizes={sizes}
            alt='Miguel the cat'
          />
        </Picture>
      </Demo>

      <Demo
        title='2. Blur-up placeholder and priority'
        caption={'felix.jpg imported with ?placeholder. A standalone <Image>: the 16px data-url is its background '
          + 'until the image loads, and `priority` makes it eager with a high fetch priority. `priority` belongs on a '
          + 'standalone image only - inside a <picture> it would preload the fallback format.'}
        srcSet={felixImage.srcSet}
      >
        <Image
          src={felixImage.src}
          srcSet={felixImage.srcSet}
          sizes={sizes}
          placeholder={felixImage.placeholder}
          priority
          alt='Felix the cat'
        />
        <div
          class='placeholder-swatch'
          style={{
            backgroundImage: `url(${felixImage.placeholder})`
          }}
        />
      </Demo>

      <Demo
        title='3. Transparency: png + webp'
        caption={'miguel-sticker.png with a rule keeping png and adding webp. The checkerboard shows through, '
          + 'so the alpha channel survived both the resize and the conversion.'}
        srcSet={miguelSticker.srcSet}
      >
        <Picture
          class='checkerboard'
          srcSet={miguelSticker.srcSet}
          sizes={sizes}
        >
          <Image
            src={miguelSticker.src}
            srcSet={miguelSticker.srcSet}
            sizes={sizes}
            alt='Miguel sticker with a transparent background'
          />
        </Picture>
      </Demo>

      <Demo
        title='4. Animation: gif + webp'
        caption={'animation.gif with a rule keeping gif and adding webp. Both outputs keep all 50 frames, '
          + 'so the animation still plays - modern browsers pick the animated webp.'}
        srcSet={animation.srcSet}
      >
        <Picture
          srcSet={animation.srcSet}
          sizes={sizes}
        >
          <Image
            src={animation.src}
            srcSet={animation.srcSet}
            sizes={sizes}
            alt='Animation'
          />
        </Picture>
      </Demo>
    </>
  )
}
