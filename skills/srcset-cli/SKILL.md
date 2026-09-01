---
name: srcset-cli
description: Generate responsive image variants from the command line with @srcset/cli — resize, convert to modern formats and optimize by glob and rules, and bake ES modules that import the variants so a project can commit the result and drop its bundler integration. Apply when asked to resize, convert, optimize or bake images without a bundler.
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
    - cli
    - sharp
    - image-optimization
    - codegen
---

# srcset CLI

[`@srcset/cli`](https://github.com/TrigenSoftware/srcset/tree/main/packages/cli) resizes, converts and optimizes images with [sharp](https://sharp.pixelplumbing.com/) from the command line. With `--module` it also **bakes**: alongside the variants it writes an ES module importing them, so a project can commit the result and never install a bundler integration.

Use it when the user asks to prepare responsive images, convert a folder to webp/avif, shrink images for the web, or bake image modules. For wiring a bundler instead, use the `setup-srcset` skill.

```bash
pnpm add -D @srcset/cli
pnpm srcset "src/images/*.jpg" --width 1920,1280,860,320 --format jpg,webp,avif -d static/images
```

Use the project's package manager throughout — `yarn add -D` and `yarn srcset`, `npm i -D` and `npm exec srcset`.

Documentation: <https://srcset.js.org/integrations/cli/>

## Command

```
srcset [...sources] [...options]
```

| Option | Meaning |
|---|---|
| `sources` | Glob pattern(s) for the source images. Quote them so the shell does not expand them. |
| `--dest`, `-d` | Destination directory. Required (or `dest` in the config). |
| `--width`, `-w` | Widths to resize to. A value **≤ 1 is a multiplier** of the source width. |
| `--format`, `-f` | Formats to convert to. **The first one is the fallback.** |
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

## Config File

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

## Rules

Same rules as the bundler integrations:

- the **first matched rule wins**; `fallthrough: true` keeps matching after it;
- a rule without `match` matches everything — it goes last, as the catch-all;
- `match` takes a glob, a CSS media query against the source size (`'(min-width: 1920px)'`), a function, or an array of them, in which case **all** must match;
- `width` ≤ 1 is a multiplier, above 1 is absolute pixels; pixels are never upscaled;
- the **first `format` is the fallback** — the default export and `src` of a baked module;
- keep png as png and gif as gif in their own rules, or transparency and animation are lost;
- svg is never resized or converted: it passes through only when the rule's `format` is unset or includes `svg` — a raster-only `format` drops it silently.

## Baking Modules

`--module` writes an ES module that imports the variants it just generated:

```bash
pnpm srcset "src/images/*.jpg" -d src/baked --module ts -w 1,0.5 -f jpg,webp
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

### The four module formats

| Format | Layout |
|---|---|
| `ts` / `js` | Module flat, next to the variants, named after the source: `dist/images/photo.ts` |
| `ts-dir` / `js-dir` | A folder named after the source holding the variants and an `index.ts` / `index.js`: `dist/images/photo/index.ts` |

Flat mirrors the source tree one-to-one; `-dir` keeps one image's files together and lets the app import the folder: `import photo from './baked/images/photo'`.

### Using a baked module

```ts
import photo, { src, srcSet } from './baked/images/photo'
import { getImageProps } from '@srcset/runtime'

const { src: imgSrc, srcSet: imgSrcSet } = getImageProps(src, srcSet)
```

What the project must provide, because the cli deliberately does not touch it:

- **A way to import the image files.** Vite handles asset imports natively. Webpack and Rspack need an `asset/resource` rule for those extensions — there is no built-in one for `.jpg`.
- **`sideEffects: false`** in the project's `package.json`, if unused variants should be dropped. Without it a bundler keeps every import. Note that Rollup, and so Vite, emits asset files regardless of tree-shaking; webpack can drop them.
- **A `.d.ts`, if a `js` module is used in a TypeScript project.** The cli generates no declarations. In a TypeScript project use `ts` or `ts-dir` — a typescript module narrows the formats with `as const`, so its entries are assignable to `SrcSetEntry` without importing a type.
- **Ambient types for the image imports inside a `ts` module.** The module itself imports `./photo.jpg`, so a `declare module '*.jpg'` with a default `string` export must exist per baked extension — `vite/client` already provides them; with webpack, write them in a `.d.ts`.

File names stay exactly as configured — no hashes are added. A project that wants hashed names should let its bundler add them, or set a `postfix`.

## Recipes

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
pnpm srcset "src/images/**/*.jpg" -d src/baked --module ts-dir -w 1,0.5 -f jpg,webp -v
```

Bake with a blur-up placeholder, and point the default export at the webp variant — no config file involved:

```bash
pnpm srcset "src/images/**/*.jpg" -d src/baked --module ts -w 1,0.5 -f jpg,webp \
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

## Verify

Run with `-v` and read the `source -> output` lines: one per variant plus, when baking, one per module. Then check the destination tree and, for a baked module, that the app's bundler resolves the imports — build the project, do not just eyeball the file.

## Pitfalls

- Repeated `-m` values are an **and**, not an or: `-m '**/*.jpg' -m '**/hero*'` matches only the jpg files whose name starts with `hero`. For "either" use one brace glob, `-m '**/*.{jpg,png}'`, or one media query list.
- Quote the source globs. Unquoted, the shell expands them itself: `**` silently loses its recursive meaning in shells without `globstar`, and zsh errors out when nothing matches.
- `--width 0.5` is a **multiplier**, `--width 500` is pixels. `-w 1` means "the original width", which is how the untouched-size variant is requested.
- Without `-w`, only the source width is generated; without `-f`, only the source format. With neither the run just re-encodes the originals — a valid optimize-only pass, but no `srcset`.
- An image that no rule matched is skipped silently — nothing is written for it, and in `--module` mode no module is written either.
- A source that sharp cannot decode fails the whole run with `Cannot read image "<path>"`. That is deliberate: a corrupt file the user pointed at should not be passed over.
- Re-running does not clean the destination. Removing a rule leaves the files it used to write in place.
