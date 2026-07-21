/* oxlint-disable trigen/import-order */
/**
 * Ambient module declarations for image imports handled by @srcset/loader.
 *
 * Usage: add to tsconfig `types` or reference directly:
 * /// <reference types="@srcset/loader/client" />
 */

declare module '*.jpg' {
  import type { SrcSetEntry } from '@srcset/runtime'

  const url: string

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
  export default url
}

declare module '*.jpeg' {
  import type { SrcSetEntry } from '@srcset/runtime'

  const url: string

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
  export default url
}

declare module '*.png' {
  import type { SrcSetEntry } from '@srcset/runtime'

  const url: string

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
  export default url
}

declare module '*.webp' {
  import type { SrcSetEntry } from '@srcset/runtime'

  const url: string

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
  export default url
}

declare module '*.avif' {
  import type { SrcSetEntry } from '@srcset/runtime'

  const url: string

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
  export default url
}

declare module '*.gif' {
  import type { SrcSetEntry } from '@srcset/runtime'

  const url: string

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
  export default url
}
