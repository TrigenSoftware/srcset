# @srcset/imgproxy

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Fimgproxy.svg
[npm-url]: https://npmjs.com/package/@srcset/imgproxy

[node]: https://img.shields.io/node/v/%40srcset%2Fimgproxy.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Fimgproxy
[deps-url]: https://libraries.io/npm/%40srcset%2Fimgproxy

[size]: https://deno.bundlejs.com/badge?q=%40srcset%2Fimgproxy
[size-url]: https://bundlejs.com/?q=%40srcset%2Fimgproxy

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/srcset/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/srcset?branch=main

Adapter for [imgproxy](https://imgproxy.net/): srcset variant urls for content images, e.g. from an API or a CMS.

- 🌐 Runtime builder of loader-shaped srcset objects, isomorphic: browser and server
- 🔒 Presets support via the `processing` hook - no transformations exposed to the browser
- ✍️ Url signing on the server side
- 🛠 Passthrough mode for local development without a running imgproxy instance

## Install

```bash
# pnpm
pnpm add @srcset/imgproxy @srcset/runtime
# yarn
yarn add @srcset/imgproxy @srcset/runtime
# npm
npm i @srcset/imgproxy @srcset/runtime
```

## Usage

Srcset objects for CMS images:

```ts
import { Imgproxy } from '@srcset/imgproxy'

const imgproxy = new Imgproxy({ endpoint: 'https://imgproxy.example.com' })
const { src, srcSet, srcMap } = imgproxy.image(photo.url, {
  width: [600, 1200],
  format: ['webp', 'jpg']
})
```

Signed urls, on the server side:

```ts
import { sign } from '@srcset/imgproxy/sign'

const imgproxy = new Imgproxy({
  endpoint: 'https://imgproxy.example.com',
  signer: sign({ key, salt })
})
```

Passthrough mode - untouched source urls, e.g. for local development without a running imgproxy instance:

```ts
const imgproxy = new Imgproxy({
  endpoint: 'https://imgproxy.example.com',
  passthrough: import.meta.env.DEV
})
```

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/proxies/imgproxy/).
