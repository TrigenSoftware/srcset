# @srcset/loader

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Floader.svg
[npm-url]: https://npmjs.com/package/@srcset/loader

[node]: https://img.shields.io/node/v/%40srcset%2Floader.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Floader
[deps-url]: https://libraries.io/npm/%40srcset%2Floader

[size]: https://packagephobia.com/badge?p=%40srcset%2Floader
[size-url]: https://packagephobia.com/result?p=%40srcset%2Floader

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://img.shields.io/codecov/c/github/TrigenSoftware/srcset.svg
[coverage-url]: https://app.codecov.io/gh/TrigenSoftware/srcset

[Webpack](https://webpack.js.org/) and [Rspack](https://rspack.rs/) loader for generating responsive images.

- 🧩 Image imports are processed by default - no query markers required
- 🌳 Tree-shakable image modules: unused exports are dropped from the bundle
- 🌫 Blur-up placeholders inlined as data-urls
- 🖼 Variants encoded with [sharp](https://sharp.pixelplumbing.com/): widths, modern formats and optimization

## Install

```bash
# pnpm
pnpm add -D @srcset/loader @srcset/runtime
# yarn
yarn add -D @srcset/loader @srcset/runtime
# npm
npm i -D @srcset/loader @srcset/runtime
```

## Usage

```js
// webpack.config.js / rspack.config.js
export default {
  module: {
    rules: [
      {
        test: /\.jpe?g$/i,
        use: {
          loader: '@srcset/loader',
          options: {
            rules: [
              // First format is the fallback: default export and src
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

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/integrations/loader/).
