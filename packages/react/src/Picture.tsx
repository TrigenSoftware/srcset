import type {
  ComponentProps,
  ReactNode
} from 'react'
import {
  type SrcSetEntry,
  getSourceProps
} from '@srcset/runtime'

export interface PictureProps extends ComponentProps<'picture'> {
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
  children: ReactNode
}

/**
 * `<picture>` element with `<source>` per format group of the variants,
 * ordered by format efficiency (avif, webp, then the rest).
 * Children must contain an `<img>` element, e.g. the `Image` component:
 * `<picture>` renders nothing without it.
 * @param props - Picture props.
 */
export function Picture({
  srcSet,
  sizes,
  children,
  ...props
}: PictureProps) {
  return (
    <picture {...props}>
      {getSourceProps(srcSet).map(source => (
        <source
          key={source.type}
          type={source.type}
          srcSet={source.srcSet}
          sizes={sizes}
        />
      ))}
      {children}
    </picture>
  )
}
