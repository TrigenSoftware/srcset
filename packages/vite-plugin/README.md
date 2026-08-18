# @srcset/vite-plugin

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Fvite-plugin.svg
[npm-url]: https://npmjs.com/package/@srcset/vite-plugin

[node]: https://img.shields.io/node/v/%40srcset%2Fvite-plugin.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Fvite-plugin
[deps-url]: https://libraries.io/npm/%40srcset%2Fvite-plugin

[size]: https://packagephobia.com/badge?p=%40srcset%2Fvite-plugin
[size-url]: https://packagephobia.com/result?p=%40srcset%2Fvite-plugin

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://img.shields.io/codecov/c/github/TrigenSoftware/srcset.svg
[coverage-url]: https://app.codecov.io/gh/TrigenSoftware/srcset

Vite plugin for generating responsive images.

- 🧩 Image imports are processed by default; native Vite queries like `?url` stay in the asset pipeline
- 🌳 Tree-shakable image modules: unused exports are dropped from the bundle
- 🌫 Blur-up placeholders inlined as data-urls
- 🖼 Variants encoded with [sharp](https://sharp.pixelplumbing.com/): widths, modern formats and optimization

## Install

```bash
# pnpm
pnpm add -D @srcset/vite-plugin @srcset/runtime
# yarn
yarn add -D @srcset/vite-plugin @srcset/runtime
# npm
npm i -D @srcset/vite-plugin @srcset/runtime
```

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite'
import { srcset } from '@srcset/vite-plugin'

export default defineConfig({
  plugins: [
    srcset({
      rules: [
        // First format is the fallback: default export and src
        {
          match: '**/*.jpg',
          width: [1, 0.5],
          format: ['jpg', 'webp', 'avif']
        },
        {
          match: '**/*.gif',
          width: [1, 0.5],
          format: ['gif', 'webp']
        }
      ],
      placeholder: true
    })
  ]
})
```

```ts
import url, { src, srcSet, srcMap, placeholder } from './photo.jpg'

// url - url of the selected variant, e.g. '/assets/photo.f37e2d3a.jpg'
// src - selected variant: { id: 'jpg1200', format: 'jpg', type: 'image/jpeg', width: 1200, height: 800, url }
// srcSet - array of all generated variants
// srcMap - id-to-url map, e.g. srcMap.webp600
// placeholder - blur-up data-url, when the `placeholder` option is enabled

const img = `<img src="${url}" srcset="${srcSet.map(({ url, width }) => `${url} ${width}w`).join(', ')}">`
```

The module is tree-shakable: import only what you use - the rest is dropped from the bundle.

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/integrations/vite-plugin/).
