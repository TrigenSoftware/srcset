/* oxlint-disable trigen/import-order */
/**
 * Ambient module declarations for image imports handled by @srcset/vite-plugin.
 * Only the named exports are declared: the default url export
 * comes from the `vite/client` asset types.
 *
 * Usage: add to tsconfig `types` or reference directly:
 * /// <reference types="@srcset/vite-plugin/client" />
 */

declare module '*.jpg' {
  import type { SrcSetEntry } from '@srcset/runtime'

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
}

declare module '*.jpeg' {
  import type { SrcSetEntry } from '@srcset/runtime'

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
}

declare module '*.png' {
  import type { SrcSetEntry } from '@srcset/runtime'

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
}

declare module '*.webp' {
  import type { SrcSetEntry } from '@srcset/runtime'

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
}

declare module '*.avif' {
  import type { SrcSetEntry } from '@srcset/runtime'

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
}

declare module '*.gif' {
  import type { SrcSetEntry } from '@srcset/runtime'

  export const src: SrcSetEntry
  export const srcSet: SrcSetEntry[]
  export const srcMap: Record<string, string>
  export const placeholder: string | undefined
}
