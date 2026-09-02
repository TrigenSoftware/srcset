---
name: srcset
description: Write application code that uses srcset — import the generated image module, render it with the Picture and Image components or the runtime helpers, size it with `sizes`, and generate or bake variants with the cli. Apply when writing or changing code that displays images in a project already set up with srcset.
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
    - react
    - preact
    - svelte
    - cli
    - image-optimization
---

# srcset

[srcset](https://github.com/TrigenSoftware/srcset) turns an image import into a **module carrying every generated variant**, so a page renders a real `srcset` instead of one fixed file.

Use this skill to write code against it: importing the module, rendering it, and generating variants from the command line. To wire an integration into a project for the first time, use the `setup-srcset` skill instead.

Documentation: <https://srcset.js.org>

## The image module

```ts
import url, { src, srcSet, srcMap, placeholder } from './photo.jpg'
```

| Export | What it is |
| --- | --- |
| `default` | Url of the selected variant |
| `src` | The selected variant: `{ id, format, type, width, height, url }` |
| `srcSet` | Every generated variant, as an array |
| `srcMap` | Id-to-url map, e.g. `srcMap.webp640` — the id is the format plus the actual width |
| `placeholder` | Blur-up data-url, when the `placeholder` option is on |

The module is tree-shakable, so importing `url` alone leaves the rest out of the bundle.

**Two things produce it, and their exports are identical**: a bundler integration, where the import is the image file itself, and the cli in `--module` mode, where the module is a real file on disk that the project commits. Code written against one works against the other, so everything below applies to both.

The **default export and `src`** point at the variant in the source format at the source width; when the rules produced no such variant, the first generated one wins.

## Rendering

Do not build `srcset` strings by hand. Grouping by mime type and ordering by format efficiency is what the runtime and the components are for.

### With the components

`@srcset/react`, `@srcset/preact` and `@srcset/svelte` ship the same two components.

```tsx
import { Picture, Image } from '@srcset/react'
import { src, srcSet, placeholder } from './photo.jpg'

// The layout width of the image, which the browser needs before it has laid
// the page out: 800px on wide screens, the full viewport width otherwise.
const sizes = '(min-width: 900px) 800px, 100vw'

<Picture srcSet={srcSet} sizes={sizes}>
  <Image src={src} srcSet={srcSet} sizes={sizes} placeholder={placeholder} alt='A photo' />
</Picture>
```

Rules that matter:

- **`srcSet` goes to both.** `Picture` splits it into a `<source>` per format; `Image` narrows it to the format of `src` for the fallback `<img>`. Given only to `Picture`, the `<img>` is left with one fixed url, and a browser that falls through to it downloads the full sized file on a phone.
- **`src` goes to `Image` only.** It selects the fallback format, supplies the `src` attribute, and gives the intrinsic `width`/`height` that hold the layout still. `Picture` has no `src` prop.
- **`sizes` goes to both.** The `sizes` of an `<img>` does not apply to a selected `<source>`.
- **`placeholder`** is shown as a background until the image loads, once per mount. For a new image source, remount: a `key` in React and Preact, a `{#key}` block in Svelte.
- **`priority`** switches `loading="lazy"` to `eager` with `fetchpriority="high"`, for the one image that is the largest contentful paint. None of the three packages preloads, so it is safe inside a `Picture`; a real preload is a `<link rel="preload">` you add yourself, pointed at the format the browser will take.
- **`Image` alone**, without a `Picture`, is the right call when the rule generates one format: it still carries the widths.

Per-framework differences:

| | React | Preact | Svelte |
| --- | --- | --- | --- |
| Element ref | `ref` | `imgRef` | `bind:ref` |
| Prop casing | `className`, `fetchPriority` | `class`, `fetchPriority` in JSX, `fetchpriority` in the DOM | `class`, `fetchpriority` |
| `style` | object | object | string |

### Without a framework

```ts
import { getImageProps, getSourceProps } from '@srcset/runtime'
import { src, srcSet } from './photo.jpg'

const sources = getSourceProps(srcSet)            // [{ type, srcSet }] per format
const imageProps = getImageProps(src, srcSet)     // { src, srcSet } for the <img>
```

`getSourceProps` groups by mime type and orders avif, then webp, then the rest. `getImageProps` filters the set to the format of `src`, and omits `srcSet` when it would duplicate the url. Which comes out as:

```html
<picture>
  <source type="image/avif" sizes="..." srcset="/assets/photo.avif 1920w, /assets/photo@1280w.avif 1280w">
  <source type="image/webp" sizes="..." srcset="/assets/photo.webp 1920w, /assets/photo@1280w.webp 1280w">
  <img src="/assets/photo.jpg" sizes="..." srcset="/assets/photo.jpg 1920w, /assets/photo@1280w.jpg 1280w"
    width="1920" height="1280" alt="A photo">
</picture>
```

### sizes and retina

A `w` descriptor states how wide the file is, not which screen it is for. The browser takes the layout width from `sizes`, multiplies it by its own pixel ratio, and picks a variant that covers the result. 800px of layout takes the 1280px file on an ordinary screen, and the 1920px one on a retina display.

So **one list of widths covers both**, and there is no `@2x` rule to write — the list just has to reach twice the largest layout width. Set `sizes` whenever the image is not full width: without it the browser assumes `100vw` and over-fetches.

## Per-import overrides

Build-time integrations only — a baked module is already generated, so its options were fixed by the cli run. Parts combine with `&`:

- a **JSON rule** replaces the whole rule set for that import: `./photo.jpg?{"width":[1,0.5],"format":["webp","jpg"]}`
- `id=`, `format=`, `width=` pick the variant the default export points at: `./photo.jpg?format=webp&width=600`
- `placeholder` / `placeholder=false` switches the placeholder export on or off

## Rules

A rule is a matcher plus what to generate, and the same rule objects go into the plugin, the loader, the cli config and an import query:

- the **first matched rule wins**; `fallthrough: true` keeps matching after it;
- a rule without `match` matches everything — it goes last, as the catch-all;
- `match` takes a glob, a CSS media query against the source size (`'(min-width: 1920px)'`), a function, or an array of them, in which case **all** must match;
- `width` ≤ 1 is a multiplier, above 1 is absolute pixels; pixels are never upscaled;
- the default export and `src` of a baked module point at the variant in the **source format at the source width**, and fall back to the first `format` of the list only when the source format is not in it;
- keep png as png and gif as gif in their own rules, or transparency and animation are lost;
- svg is never resized or converted: it passes through only when the rule's `format` is unset or includes `svg` — a raster-only `format` drops it silently.

## The cli

[`@srcset/cli`](https://github.com/TrigenSoftware/srcset/tree/main/packages/cli) resizes, converts and optimizes images with [sharp](https://sharp.pixelplumbing.com/) from the command line. With `--module` it also **bakes**: alongside the variants it writes the module above as a file, so a project can commit the result and never install a bundler integration.

```sh
pnpm add -D @srcset/cli
pnpm srcset "src/images/*.jpg" --width 1920,1280,860,320 --format jpg,webp,avif -d static/images
```

Use the project's package manager throughout — `yarn add -D` and `yarn srcset`, `npm i -D` and `npm exec srcset`.

### Command

```
srcset [...sources] [...options]
```

| Option | Meaning |
|---|---|
| `sources` | Glob pattern(s) for the source images. Quote them so the shell does not expand them. |
| `--dest`, `-d` | Destination directory. Required (or `dest` in the config). |
| `--width`, `-w` | Widths to resize to. A value **≤ 1 is a multiplier** of the source width. |
| `--format`, `-f` | Formats to convert to. The first one is the fallback when the source format is not among them. |
| `--match`, `-m` | Glob or media query to match images by name or size. Repeat to add more — **all** of them must match. |
| `--module` | Bake a module: `ts`, `js`, `ts-dir` or `js-dir`. |
| `--placeholder` | Add the `placeholder` export. `--no-placeholder` switches off one enabled in the config. |
| `--placeholder-width`, `--placeholder-format` | 16 and `webp` by default; `webp` or `jpg`. Either one implies `--placeholder`. |
| `--select-id`, `--select-format`, `--select-width` | Which variant the module's default export points at. |
| `--skip-optimization` | Do not re-encode the original variant and skip custom optimizers. |
| `--no-scaling-up` | Do not emit variants wider than the source. |
| `--concurrency` | Concurrency limit. |
| `--config`, `-c` | Config file path. Defaults to looking up `srcset.config.js`. |
| `--verbose`, `-v` | Print every written file as `source -> output`. |
| `--help`, `-h` | Print the usage. |

`-w` and `-f` take several values either comma-separated (`-w 1920,1280`) or as repeated flags (`-f jpg -f webp`). `-m` takes its argument as it is — commas inside a brace glob or a media query list are the value's own — so several patterns are passed as repeated `-m`.

Output paths keep the source directory structure relative to the current directory: `images/photo.jpg` with `--dest dist` lands at `dist/images/photo.jpg`. Resized variants get a `@<width>w` postfix — `dist/images/photo@1280w.webp`. Sources outside the current directory keep only their file name, and two of them colliding on one output path stops the run.

### Config file

`srcset.config.js` is an ES module with the options object as the default export. The project must be `"type": "module"`, or pass an `.mjs` file with `--config`.

```js
export default {
  src: 'src/images/**/*.jpg',
  dest: 'static/images',
  module: 'ts',
  placeholder: true,
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
  ]
}
```

A command line argument wins over the config value. **Note that `-m`, `-w` and `-f` build one single rule that replaces the whole `rules` list of the config** — they do not merge into it, and the same goes for the placeholder and select options.

Only two things need the config file, because neither is expressible as an argument: **more than one rule**, and the options that are functions or nested objects — `resourceId`, `optimization`, `processing`, and `postfix` as a formatter. Everything else has a flag.

`placeholder`, `select` and `resourceId` shape the baked module and do nothing without `module`.

### Baking modules

`--module` writes an ES module that imports the variants it just generated:

```bash
pnpm srcset "images/*.jpg" -d src/baked --module ts -w 1,0.5 -f jpg,webp
```

```ts
// src/baked/images/photo.ts
import photo_jpg from "./photo.jpg"
import photo_780w_jpg from "./photo@780w.jpg"
import photo_webp from "./photo.webp"
import photo_780w_webp from "./photo@780w.webp"

const url = photo_jpg;
const src = { id: "jpg1560", format: "jpg" as const, /* ... */ url: url };

export default url;
export { src };
export const srcSet = [src, /* ... */];
export const srcMap = { "jpg1560": url, /* ... */ };
export const placeholder = undefined;
```

The exports are identical to what the Vite plugin and the loader produce, so app code written against one works against the other.

#### The four module formats

| Format | Layout |
|---|---|
| `ts` / `js` | Module flat, next to the variants, named after the source: `dist/images/photo.ts` |
| `ts-dir` / `js-dir` | A folder named after the source holding the variants and an `index.ts` / `index.js`: `dist/images/photo/index.ts` |

Flat mirrors the source tree one-to-one; `-dir` keeps one image's files together and lets the app import the folder: `import photo from './baked/images/photo'`.

#### Using a baked module

```ts
import { getImageProps } from '@srcset/runtime'
import photo, { src, srcSet } from './baked/images/photo'

const { src: imgSrc, srcSet: imgSrcSet } = getImageProps(src, srcSet)
```

The components take these exports exactly as in [Rendering](#rendering) — only the import path differs, because the module is a file in the project rather than the image itself.

What the project must provide, because the cli deliberately does not touch it:

- **A way to import the image files.** Vite handles asset imports natively. Webpack and Rspack need an `asset/resource` rule for those extensions — there is no built-in one for `.jpg`.
- **`sideEffects: false`** in the project's `package.json`, if unused variants should be dropped. Without it a bundler keeps every import. Note that Rollup, and so Vite, emits asset files regardless of tree-shaking; webpack can drop them.
- **A `.d.ts`, if a `js` module is used in a TypeScript project.** The cli generates no declarations. In a TypeScript project use `ts` or `ts-dir` — a typescript module narrows the formats with `as const`, so its entries are assignable to `SrcSetEntry` without importing a type.
- **Ambient types for the image imports inside a `ts` module.** The module itself imports `./photo.jpg`, so a `declare module '*.jpg'` with a default `string` export must exist per baked extension — `vite/client` already provides them; with webpack, write them in a `.d.ts`.

File names stay exactly as configured — no hashes are added. A project that wants hashed names should let its bundler add them, or set a `postfix`.

### Recipes

Convert a folder of photos to modern formats, keeping the original as the fallback (png and gif belong in config rules of their own — a flat `-f` list would convert them to jpg):

```bash
pnpm srcset "assets/**/*.jpg" -d dist -f jpg,webp,avif
```

Make one image responsive at several widths:

```bash
pnpm srcset "src/hero.jpg" -d public -w 1920,1280,640 -f jpg,webp
```

Half-size copies of everything, originals untouched:

```bash
pnpm srcset "images/*" -d thumbs -w 0.5
```

Bake a folder of photos into a TypeScript project (a mixed folder with png or gif needs config rules, like the config example above):

```bash
pnpm srcset "images/**/*.jpg" -d src/baked --module ts-dir -w 1,0.5 -f jpg,webp -v
```

Bake with a blur-up placeholder, and point the default export at the webp variant — no config file involved:

```bash
pnpm srcset "images/**/*.jpg" -d src/baked --module ts -w 1,0.5 -f jpg,webp \
  --placeholder --placeholder-width 24 --select-format webp
```

Repeatable setup — put it in the config and add a script:

```json
{
  "scripts": {
    "images": "srcset"
  }
}
```

### Verify a run

Run with `-v` and read the `source -> output` lines: one per variant plus, when baking, one per module. Then check the destination tree and, for a baked module, that the app's bundler resolves the imports — build the project, do not just eyeball the file.

## Pitfalls

- **`srcSet` given only to `Picture`.** The fallback `<img>` is then a single fixed url, and the browser that falls through to it downloads the full sized file. Pass it to both, and pass `sizes` to both too.
- **A missing `sizes`.** The browser assumes `100vw` and picks the widest variant for a thumbnail.
- **A `placeholder` that does not reset.** It is shown once per mount, so a new image source needs a remount — `key`, or a `{#key}` block in Svelte.
- **`priority` on more than one image.** Marking everything as priority is the same as marking nothing.
- Repeated `-m` values are an **and**, not an or: `-m '**/*.jpg' -m '**/hero*'` matches only the jpg files whose name starts with `hero`. For "either" use one brace glob, `-m '**/*.{jpg,png}'`, or one media query list.
- **A `match` glob is tested against the absolute path.** `'src/images/*.jpg'` matches nothing; anchor it with `**/`, as `'**/src/images/*.jpg'`.
- Quote the source globs. Unquoted, the shell expands them itself: `**` silently loses its recursive meaning in shells without `globstar`, and zsh errors out when nothing matches.
- `--width 0.5` is a **multiplier**, `--width 500` is pixels. `-w 1` means "the original width", which is how the untouched-size variant is requested.
- Without `-w`, only the source width is generated; without `-f`, only the source format. With neither the run just re-encodes the originals — a valid optimize-only pass, but no `srcset`.
- An image that no rule matched is skipped silently — nothing is written for it, and in `--module` mode no module is written either.
- A source that sharp cannot decode fails the whole run with `Cannot read image "<path>"`. That is deliberate: a corrupt file the user pointed at should not be passed over.
- Re-running does not clean the destination. Removing a rule leaves the files it used to write in place.
