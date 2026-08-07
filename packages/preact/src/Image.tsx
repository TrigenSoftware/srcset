import type {
  CSSProperties,
  ComponentProps,
  Ref,
  TargetedEvent
} from 'preact'
import {
  useCallback,
  useState
} from 'preact/hooks'
import {
  type SrcSetEntry,
  getImageProps
} from '@srcset/runtime'

function applyRef<T>(ref: Ref<T> | undefined, node: T | null) {
  if (typeof ref === 'function') {
    // Preact 10.23+ callback refs may return a cleanup function: pass it through.
    return ref(node)
  }

  if (ref) {
    ref.current = node
  }

  return undefined
}

export interface ImageProps extends Omit<ComponentProps<'img'>, 'src' | 'srcSet' | 'srcset' | 'placeholder' | 'style' | 'ref' | 'fetchpriority'> {
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
   * Load the image eagerly with high priority.
   */
  priority?: boolean
  /**
   * Inline styles, merged with the placeholder background.
   */
  style?: CSSProperties
  /**
   * Ref to the `<img>` element: plain Preact does not forward
   * the `ref` prop to function components.
   */
  imgRef?: Ref<HTMLImageElement>
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
  imgRef,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false)
  const imageProps = getImageProps(src, srcSet)
  const showPlaceholder = Boolean(placeholder) && !loaded
  const onLoadCallback = useCallback(
    (event: TargetedEvent<HTMLImageElement>) => {
      setLoaded(true)
      onLoad?.(event)
    },
    [onLoad]
  )
  // The load event may have fired before hydration for cached images.
  const refCallback = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) {
        setLoaded(true)
      }

      return applyRef(imgRef, node)
    },
    [imgRef]
  )
  let finalWidth = width
  let finalHeight = height

  // The intrinsic pair applies only as a whole: with a single explicit
  // dimension, filling the other from the variant would skew the ratio.
  if (width === undefined && height === undefined && src) {
    finalWidth = src.width
    finalHeight = src.height
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
      fetchpriority={priority ? 'high' : fetchPriority}
      data-loading={loaded ? undefined : ''}
      onLoad={onLoadCallback}
      style={showPlaceholder
        ? {
          backgroundImage: `url(${placeholder})`,
          backgroundSize: 'cover',
          // oxlint-disable-next-line typescript/no-misused-spread
          ...style
        }
        : style}
    />
  )
}
