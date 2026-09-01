import { basename } from 'node:path'

const identifierStart = /^[^a-z_$]/i
const identifierUnsafe = /[^\w$]/g

/**
 * Make a javascript identifier to import a variant file with. Derived from
 * the file name rather than from the resource id: an id is neither unique
 * across variants nor guaranteed to be a valid identifier.
 * @param path - Variant file path.
 * @param used - Identifiers already taken by this module.
 * @returns Unique identifier.
 */
export function toIdentifier(path: string, used: Set<string>) {
  // The extension is a part of the name: `felix.jpg` and `felix.webp`
  // are two imports of one module.
  const name = basename(path).replace(identifierUnsafe, '_')
  const base = identifierStart.test(name) ? `_${name}` : name
  let identifier = base
  let index = 1

  while (used.has(identifier)) {
    identifier = `${base}_${index++}`
  }

  used.add(identifier)

  return identifier
}

/**
 * Make the module code: the variant urls come from imports of the files
 * next to it, so the bundler of the project resolves them as plain assets.
 * @param imports - Identifier and file name of every imported variant.
 * @param body - Module code from the generator.
 * @returns Module code with the imports.
 */
export function withImports(imports: [string, string][], body: string) {
  if (!imports.length) {
    return body
  }

  // A file name is not a safe string literal: quotes and line breaks
  // in it are legal on every platform we run on.
  const lines = imports.map(
    ([identifier, name]) => `import ${identifier} from ${JSON.stringify(`./${name}`)}`
  )

  return `${lines.join('\n')}\n\n${body}`
}
