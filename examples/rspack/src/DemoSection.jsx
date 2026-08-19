/**
 * List of the generated variants: id, width and url of every one.
 * @param props - Component props.
 * @param props.srcSet - All generated variants.
 * @returns List element.
 */
function VariantList({ srcSet }) {
  return (
    <ul className='variants'>
      {srcSet.map(({ id, width, url }) => (
        <li key={id}>
          {id} - {width}w - {url}
        </li>
      ))}
    </ul>
  )
}

/**
 * Demo section: a heading, the images, a caption and the variant list.
 * @param props - Component props.
 * @param props.title - Section title.
 * @param props.caption - Caption text under the images.
 * @param props.srcSet - All generated variants, printed under the caption.
 * @param props.children - Images to show.
 * @returns Section element.
 */
export function DemoSection({
  title,
  caption,
  srcSet,
  children
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
      <p className='caption'>{caption}</p>
      <VariantList srcSet={srcSet} />
    </section>
  )
}
