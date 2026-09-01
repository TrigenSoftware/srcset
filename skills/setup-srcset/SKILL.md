---
name: setup-srcset
description: Add srcset responsive image generation to a project — pick the integration (Vite plugin, Webpack/Rspack loader, CLI baking, or a runtime proxy adapter), write the generation rules, wire the TypeScript types, and render the variants with the runtime helpers or the React/Preact/Svelte components. Apply when adding responsive images to a project or configuring a bundler for them.
license: MIT
compatibility:
  - Claude Code
  - Codex
  - Cursor
  - Gemini CLI
  - GitHub Copilot
  - Windsurf
  - Cline
  - Roo Code
  - Goose
  - Continue
  - OpenCode
  - Amp
  - universal
metadata:
  author: dangreen
  tags:
    - srcset
    - responsive-images
    - vite
    - webpack
    - rspack
    - sharp
    - image-optimization
---

# Setup srcset

Set up [srcset](https://github.com/TrigenSoftware/srcset) in a project: an image import turns into a **tree-shakable module** carrying every generated variant, so the app renders a real `srcset` instead of one fixed file. Variants are encoded with [sharp](https://sharp.pixelplumbing.com/) at build time.

```ts
import url, { src, srcSet, srcMap, placeholder } from './photo.jpg'
```

| Export | What it is |
|---|---|
| `default` | Url of the selected variant, e.g. `/assets/photo.f37e2d3a.jpg` |
| `src` | The selected variant: `{ id, format, type, width, height, url }` |
| `srcSet` | Every generated variant, as an array |
| `srcMap` | Id-to-url map, e.g. `srcMap.webp600` |
| `placeholder` | Blur-up data-url, when the `placeholder` option is on |

Documentation: <https://srcset.js.org>

## Pick the Integration

Ask what the project builds with, or detect it — `vite.config.*`, `webpack.config.*`, `rspack.config.*`, `package.json` scripts. Then:

| Situation | Package |
|---|---|
| Vite (also Astro, SvelteKit, Nuxt, Remix — anything on Vite) | `@srcset/vite-plugin` |
| Webpack or Rspack (also Rsbuild) | `@srcset/loader` |
| No bundler integration wanted, or images processed once and committed | `@srcset/cli` with `--module` — see the `srcset-cli` skill |
| Images are not in the repository — they come from an API or a CMS | `@srcset/imgproxy` or `@srcset/cloudflare` |

The first three are build-time: they need the image files in the project. The proxy adapters are runtime and isomorphic: they build variant urls for images served by [imgproxy](https://imgproxy.net/) or [Cloudflare](https://developers.cloudflare.com/images/), so they need no sharp and no build step, and they install as regular dependencies rather than dev ones.

A project can use several — a bundler integration for the images it ships and a proxy adapter for content images.

## Install

Always add `@srcset/runtime` alongside a build-time integration: it carries the `SrcSetEntry` type and the helpers that turn variants into DOM attributes.

```bash
pnpm add -D @srcset/vite-plugin @srcset/runtime   # vite
pnpm add -D @srcset/loader @srcset/runtime        # webpack / rspack
```

Use the project's package manager — `yarn add -D`, `npm i -D`. For a framework, add the components package too: `@srcset/react`, `@srcset/preact` or `@srcset/svelte`.

## Configure Vite

```js
// vite.config.js
import { defineConfig } from 'vite'
import { srcset } from '@srcset/vite-plugin'

export default defineConfig({
  plugins: [
    srcset({
      rules: [
        {
          match: '**/*.png',
          width: [1, 0.5],
          format: ['png', 'webp']
        },
        {
          width: [1, 0.5],
          format: ['jpg', 'webp', 'avif']
        }
      ],
      placeholder: true
    })
  ]
})
```

Every raster image import — jpg, jpeg, png, webp, avif, gif — is processed by default; native Vite queries such as `?url` and `?raw` stay in the asset pipeline untouched. Narrow the scope with `include` / `exclude` (picomatch patterns or regexps) — `exclude` defaults to `node_modules`.

`cache` is on by default and stores variants in Vite's cache directory, so repeated builds skip the encoding. It takes `{ dir, maxAge }` to move or age the storage; the dev server always uses it.

## Configure Webpack and Rspack

```js
// webpack.config.js / rspack.config.js
export default {
  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif)$/i,
        use: {
          loader: '@srcset/loader',
          options: {
            rules: [
              {
                match: '**/*.png',
                width: [1, 0.5],
                format: ['png', 'webp']
              },
              {
                width: [1, 0.5],
                format: ['jpg', 'webp', 'avif']
              }
            ],
            placeholder: true
          }
        }
      }
    ]
  }
}
```

The loader replaces whatever asset rule the project had for those extensions — remove a competing `type: 'asset/resource'` rule for the same test, or the two will fight over the same files.

Loader-specific options:

- `name` — output file name template, defaults to `[name][postfix].[contenthash:8].[ext]` (`[path][name][postfix][sourceext].[ext]` in development mode). Tokens: `[name]`, `[postfix]`, `[ext]`, `[path]`, `[sourceext]`, `[hash]`/`[contenthash]` (with optional `:length`). `[sourceext]` is the source extension, empty when the output format matches it — it keeps `photo.jpg` and `photo.png` apart when both convert to webp.
- `outputPath`, `publicPath` — a string or a resolver function; `publicPath` defaults to the compiler's.
- `context` — base directory for `[path]`, defaults to the compiler root context.
- `emitFile: false` — for an SSR build, where the client build already wrote the files.
- `cache: true` — disk cache in `node_modules/.cache/srcset`. Off by default, because the bundler's own persistent cache (`cache: { type: 'filesystem' }` in webpack, `cache: { type: 'persistent' }` in Rspack) already covers it. Turn it on when the bundler cache is off, or point it elsewhere with `{ dir, maxAge }`.

## Write the Rules

A rule is a match plus what to generate. This is where most of the setup goes, and where the surprises live:

- **The first matched rule wins.** Rules are tried in order and matching stops at the first hit. Set `fallthrough: true` to keep matching after it.
- **A rule without `match` matches everything** — it belongs last, as the catch-all.
- **`match`** takes a glob (`'**/*.png'`), a CSS media query against the source size (`'(min-width: 1920px)'`), a function, or an array of them. An array means **all** must match, not any.
- **`width`** — a number greater than 1 is absolute pixels, a number **less than or equal to 1 is a multiplier** of the source width: `[1, 0.5]` is "original and half". Pixels are never upscaled; `scalingUp: false` drops variants requested wider than the source instead of capping them.
- **`format`** — the **first format is the fallback**: it becomes the default export and `src`. Put the widely supported one first and the modern ones after it: `['jpg', 'webp', 'avif']`.
- **Keep png as png and gif as gif** in their own rules. Converting a png to jpg loses transparency, and a gif that is not kept as gif or webp loses its animation.
- **Svg is never resized or converted.** A rule passes an svg through only when its `format` is unset or includes `svg` — a raster-only `format` drops the svg silently. The Vite plugin skips `.svg` imports entirely; keep them out of the loader's `test` too.

Other generation options, usable per rule or globally: `processing` (sharp encoder options per format), `optimization` (custom optimizer functions, the only way to touch svg), `skipOptimization`, `postfix`, `concurrency`.

## Wire the TypeScript Types

Both integrations ship ambient declarations for image imports. Reference them once, in a `.d.ts` of the project or through tsconfig `types`:

```ts
/// <reference types="@srcset/vite-plugin/client" />
```

```ts
/// <reference types="@srcset/loader/client" />
```

The Vite one declares only the named exports and pulls the default url export from `vite/client`, so keep the `vite/client` reference the project already has.

## Render the Variants

Do not build `srcset` strings by hand — `@srcset/runtime` orders formats by efficiency and groups them by mime type:

```ts
import url, { src, srcSet } from './photo.jpg'
import { getImageProps, getSourceProps } from '@srcset/runtime'

const { src: imgSrc, srcSet: imgSrcSet } = getImageProps(src, srcSet)
const sources = getSourceProps(srcSet)
```

With a framework, use the components — they handle the `<picture>` structure, the blur-up placeholder and priority loading:

```tsx
import { src, srcSet, placeholder } from './photo.jpg'
import { Picture, Image } from '@srcset/react'

<Picture srcSet={srcSet}>
  <Image alt='Hero photo' src={src} placeholder={placeholder} />
</Picture>
```

`@srcset/preact` and `@srcset/svelte` expose the same two components.

## Override Per Import

The import query overrides the configured options for one import. Parts combine with `&`:

- a **JSON rule** replaces the whole rule set for that import: `./photo.jpg?{"width":[1,0.5],"format":["webp","jpg"]}`
- `id=`, `format=`, `width=` pick which variant the default export points at: `./photo.jpg?format=webp&width=600`
- `placeholder` / `placeholder=false` switches the placeholder export on or off without losing the configured placeholder options

## Placeholders

`placeholder: true` adds a tiny variant inlined as a data-url — 16px wide webp by default. `{ width, format }` changes it; `format` is `'webp'` or `'jpg'`. The export is dropped from the bundle when unused, so enabling it costs nothing until it is imported.

## Verify

1. Build the project and check that the emitted assets include the extra formats and widths, not just the originals.
2. Import an image in the app and log `srcSet` — the array length should match the rule (widths × formats).
3. Check the rendered markup: an `<img>` with a `srcset` attribute, or a `<picture>` with one `<source>` per format.
4. In TypeScript, confirm the named imports type-check — a missing `/// <reference>` shows up as "has no exported member 'srcSet'".

## Pitfalls

- A rule set with no catch-all produces an **empty module** for an unmatched image — default export `''`, `src` is `null`, `srcSet` is `[]` — and the page silently renders no image.
- `match` with an array is an **and**, not an or. Use separate rules for "either".
- The first `format` is the fallback that non-supporting browsers get. `['avif', 'jpg']` hands avif to everyone as the default export.
- In webpack and Rspack an image extension with no rule fails to import at all — there is no built-in handling for `.jpg`. Image extensions left out of the loader's `test` still need an `asset/resource` rule of their own.
- For an SSR or SSG setup, run the loader with `emitFile: false` on the server build so the same files are not written twice.
- Animated gif: keep `gif` or `webp` in the formats. Converting to jpg or avif flattens it to a single frame.
