/**
 * List of the image variants the build generated for one import.
 * @param props - Variants to list.
 * @returns Variants list element.
 */
function Variants({ srcSet }) {
  return (
    <ul class='variants'>
      {srcSet.map(variant => (
        <li key={variant.url}>
          <b>
            {variant.id}
          </b>
          {` — ${variant.width}w — ${variant.url}`}
        </li>
      ))}
    </ul>
  )
}

/**
 * One demo section: a heading, the demo itself, a caption and the list
 * of variants generated for the image it was built from.
 * @param props - Section props.
 * @returns Section element.
 */
export function Demo({
  title,
  caption,
  srcSet,
  children
}) {
  return (
    <section class='demo'>
      <h2>
        {title}
      </h2>
      {children}
      <p class='caption'>
        {caption}
      </p>
      <Variants srcSet={srcSet}/>
    </section>
  )
}
