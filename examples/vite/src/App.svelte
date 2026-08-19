<script>
  import {
    Picture,
    Image
  } from '@srcset/svelte'
  // 1. The rule lives in the import query and replaces the rules from `vite.config.js`.
  import * as miguelImage from './images/miguel.jpg?{"width":[1,0.5,0.25],"format":["avif","webp","jpg"]}'
  // 2. `?placeholder` adds the blur-up data-url export for this import only.
  import * as felixImage from './images/felix.jpg?placeholder'
  // 3. and 4. use the rules from `vite.config.js`: png + webp and gif + webp.
  import * as miguelSticker from './images/miguel-sticker.png'
  import * as animation from './images/animation.gif'
  import Demo from './Demo.svelte'

  // `sizes` goes to both the `<source>` elements and the `<img>`:
  // the `sizes` of the `<img>` does not apply to a selected `<source>`.
  const sizes = '(max-width: 48rem) 100vw, 48rem'
</script>

<!-- 1. Responsive <picture>: 3 widths x 3 formats from the import query rule. -->
<Demo
  title="1. Widths and formats"
  caption="Picture renders one <source> per format - avif, webp and jpg - at 100%, 50% and 25% width. The rule comes from the import query and overrides the config rules."
  srcSet={miguelImage.srcSet}
>
  <Picture srcSet={miguelImage.srcSet} {sizes}>
    <Image
      src={miguelImage.src}
      srcSet={miguelImage.srcSet}
      {sizes}
      alt="Miguel the cat"
    />
  </Picture>
</Demo>

<!-- 2. Blur-up: a standalone Image, the only place where `priority` is correct. -->
<Demo
  title="2. Blur-up placeholder"
  caption="A standalone Image with the placeholder data-url as its background, so the blurred preview shows while the full image loads. Without a Picture around it the srcset holds only the variants of the src format - jpg here. `priority` makes it eager with a high fetch priority: never use it inside a Picture, the preload would fetch the fallback format while the browser picks a source."
  srcSet={felixImage.srcSet}
>
  <Image
    src={felixImage.src}
    srcSet={felixImage.srcSet}
    placeholder={felixImage.placeholder}
    priority
    {sizes}
    alt="Felix the cat"
  />
</Demo>

<!-- 3. Transparency: png stays png, webp is added next to it. -->
<Demo
  title="3. Transparency"
  caption="miguel-sticker.png keeps its png variant and gains a webp one - both keep the alpha channel, shown here over a checkerboard."
  srcSet={miguelSticker.srcSet}
>
  <div class="checkerboard">
    <Picture srcSet={miguelSticker.srcSet} {sizes}>
      <Image
        src={miguelSticker.src}
        srcSet={miguelSticker.srcSet}
        {sizes}
        alt="Miguel sticker with a transparent background"
      />
    </Picture>
  </div>
</Demo>

<!-- 4. Animation: gif stays gif, webp is added and keeps every frame. -->
<Demo
  title="4. Animation"
  caption="animation.gif keeps its gif variant and gains an animated webp one - all 50 frames survive the conversion. Loaded eagerly: the demo is that it moves."
  srcSet={animation.srcSet}
>
  <Picture srcSet={animation.srcSet} {sizes}>
    <Image
      src={animation.src}
      srcSet={animation.srcSet}
      loading="eager"
      {sizes}
      alt="Animated gif"
    />
  </Picture>
</Demo>

<style>
  .checkerboard {
    display: flex;
    justify-content: center;
    border-radius: .5rem;
    background: repeating-conic-gradient(#e3e3e8 0% 25%, #fff 0% 50%) 50% / 24px 24px;
  }
</style>
