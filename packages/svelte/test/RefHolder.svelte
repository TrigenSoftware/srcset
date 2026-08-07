<script lang="ts">
  import type { SrcSetEntry } from '@srcset/runtime'
  import Image from '../src/Image.svelte'

  let {
    holder,
    src
  }: {
    holder: { current: HTMLImageElement | null }
    src: SrcSetEntry
  } = $props()
</script>

<Image
  bind:ref={holder.current}
  {src}
  alt="photo"
/>
