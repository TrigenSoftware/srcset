'use client'
import {
  type ComponentProps,
  type ReactEventHandler,
  type Ref,
  type RefCallback,
  useCallback,
  useState
} from 'react'
import { preload } from 'react-dom'
import {
  type SrcSetEntry,
  getImageProps
} from '@srcset/runtime'

function applyRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    // React 19 callback refs may return a cleanup function: pass it through.
    return ref(node)
  }

  if (ref) {
    ref.current = node
  }

  return undefined
}

export interface ImageProps extends Omit<ComponentProps<'img'>, 'src' | 'srcSet'> {
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
   * Shown once per mount: remount with a `key` for a new image source.
   */
  placeholder?: string
  /**
   * Load the image eagerly with high priority and preload it.
   * Do not use inside `Picture`: the preload would request the fallback
   * format, while the browser picks one of the `source` elements.
   */
  priority?: boolean
}

/**
 * `<img>` element from image variants: intrinsic size, lazy loading
 * and async decoding by default, optional blur-up placeholder.
 * @param props - Image props.
 */
export function Image({
  src,
  srcSet,
  placeholder,
  priority,
  width,
  height,
  loading,
  decoding,
  fetchPriority,
  style,
  onLoad,
  ref,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  const imageProps = getImageProps(src, srcSet)
  const showPlaceholder = Boolean(placeholder) && !loaded
  const onLoadCallback = useCallback<ReactEventHandler<HTMLImageElement>>(
    (event) => {
      setLoaded(true)
      onLoad?.(event)
    },
    [onLoad]
  )
  // The load event may have fired before hydration for cached images.
  const refCallback = useCallback<RefCallback<HTMLImageElement>>(
    (node) => {
      if (node?.complete && node.naturalWidth > 0) {
        setLoaded(true)
      }

      return applyRef(ref, node)
    },
    [ref]
  )
  let finalWidth = width
  let finalHeight = height

  // The intrinsic pair applies only as a whole: with a single explicit
  // dimension, filling the other from the variant would skew the ratio.
  if (width === undefined && height === undefined && src) {
    finalWidth = src.width
    finalHeight = src.height
  }

  if (priority && imageProps.src) {
    // The request policy must match the image request,
    // otherwise the preloaded response is not reusable.
    preload(imageProps.src, {
      as: 'image',
      type: src?.type,
      fetchPriority: 'high',
      imageSrcSet: imageProps.srcSet,
      imageSizes: props.sizes,
      crossOrigin: props.crossOrigin,
      referrerPolicy: props.referrerPolicy
    })
  }

  return (
    <img
      {...props}
      {...imageProps}
      ref={refCallback}
      width={finalWidth}
      height={finalHeight}
      loading={priority ? 'eager' : loading ?? 'lazy'}
      decoding={decoding ?? 'async'}
      fetchPriority={priority ? 'high' : fetchPriority}
      data-loading={loaded ? undefined : ''}
      onLoad={onLoadCallback}
      style={showPlaceholder
        ? {
          backgroundImage: `url(${placeholder})`,
          backgroundSize: 'cover',
          ...style
        }
        : style}
    />
  )
}
