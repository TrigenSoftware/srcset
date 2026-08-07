<script module lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import type { SrcSetEntry } from '@srcset/runtime'

  export interface PictureProps extends HTMLAttributes<HTMLPictureElement> {
    /**
     * Variants to render `<source>` elements from, grouped by mime type
     * and ordered by format efficiency.
     */
    srcSet: SrcSetEntry[]
    /**
     * `sizes` for the generated `<source>` elements: the `sizes` of the
     * child `<img>` does not apply to a selected `<source>`.
     * Should match the image `sizes`.
     */
    sizes?: string
    /**
     * `<img>` element, required: `<picture>` renders nothing without it.
     */
    children: Snippet
  }
</script>

<script lang="ts">
  import { getSourceProps } from '@srcset/runtime'

  let {
    srcSet,
    sizes,
    children,
    ...props
  }: PictureProps = $props()
  const sources = $derived(getSourceProps(srcSet))
</script>

<!--
  @component
  `<picture>` element with `<source>` per format group of the variants,
  ordered by format efficiency (avif, webp, then the rest).
  Children must contain an `<img>` element, e.g. the `Image` component:
  `<picture>` renders nothing without it.
-->

<picture {...props}>
  {#each sources as source (source.type)}
    <source
      type={source.type}
      srcset={source.srcSet}
      {sizes}
    />
  {/each}
  {@render children()}
</picture>
