<script module lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements'
  import type { SrcSetEntry } from '@srcset/runtime'

  export interface ImageProps extends Omit<HTMLImgAttributes, 'src' | 'srcset'> {
    /**
     * Image variant for the `src` attribute and intrinsic size.
     */
    src?: SrcSetEntry
    /**
     * Variants for the `srcset` attribute: array to build a width descriptors string
     * from the variants of the `src` format, or a ready `srcset` string.
     */
    srcSet?: SrcSetEntry[] | string
    /**
     * Data-url shown as a background until the image loads.
     * Shown once per mount: remount with a `#key` block for a new image source.
     */
    placeholder?: string
    /**
     * Load the image eagerly with high priority.
     */
    priority?: boolean
    /**
     * The `<img>` element, bindable: `<Image bind:ref={element}/>`.
     */
    ref?: HTMLImageElement | null
  }
</script>

<script lang="ts">
  import { getImageProps } from '@srcset/runtime'

  let {
    src,
    srcSet,
    placeholder,
    priority,
    width,
    height,
    loading,
    decoding,
    fetchpriority,
    style,
    onload,
    ref = $bindable(null),
    ...props
  }: ImageProps = $props()
  let loaded = $state(false)
  const imageProps = $derived(getImageProps(src, srcSet))
  const showPlaceholder = $derived(Boolean(placeholder) && !loaded)
  // The intrinsic pair applies only as a whole: with a single explicit
  // dimension, filling the other from the variant would skew the ratio.
  const intrinsic = $derived(width === undefined && height === undefined && src !== undefined)

  // The load event may have fired before hydration for cached images.
  $effect(() => {
    if (ref?.complete && ref.naturalWidth > 0) {
      loaded = true
    }
  })
</script>

<!--
  @component
  `<img>` element from image variants: intrinsic size, lazy loading
  and async decoding by default, optional blur-up placeholder.
-->

<img
  {...props}
  {...imageProps}
  bind:this={ref}
  width={intrinsic ? src?.width : width}
  height={intrinsic ? src?.height : height}
  loading={priority ? 'eager' : loading ?? 'lazy'}
  decoding={decoding ?? 'async'}
  fetchpriority={priority ? 'high' : fetchpriority}
  data-loading={loaded ? undefined : ''}
  onload={(event) => {
    loaded = true
    onload?.(event)
  }}
  style={showPlaceholder
    ? `background-image:url(${placeholder});background-size:cover;${style ?? ''}`
    : style}
/>
