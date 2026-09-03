# @srcset/cloudflare

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Fcloudflare.svg
[npm-url]: https://npmjs.com/package/@srcset/cloudflare

[node]: https://img.shields.io/node/v/%40srcset%2Fcloudflare.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Fcloudflare
[deps-url]: https://libraries.io/npm/%40srcset%2Fcloudflare

[size]: https://deno.bundlejs.com/badge?q=%40srcset%2Fcloudflare
[size-url]: https://bundlejs.com/?q=%40srcset%2Fcloudflare

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/srcset/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/srcset?branch=main

Adapter for [Cloudflare image transformations](https://developers.cloudflare.com/images/transform-images/): srcset variant urls for content images, e.g. from an API or a CMS.

- 🌐 Runtime builder of loader-shaped srcset objects, isomorphic: browser and server
- 🚀 Zero configuration on a Cloudflare zone: relative urls from `/cdn-cgi/image`, no signing
- 🔧 Custom transformations via the `processing` hook, e.g. `format=auto` negotiation
- 🛠 Passthrough mode for local development outside of a Cloudflare zone

## Install

```bash
# pnpm
pnpm add @srcset/cloudflare @srcset/runtime
# yarn
yarn add @srcset/cloudflare @srcset/runtime
# npm
npm i @srcset/cloudflare @srcset/runtime
```

## Usage

Srcset objects for CMS images, on a Cloudflare zone:

```ts
import { Cloudflare } from '@srcset/cloudflare'

const cloudflare = new Cloudflare()
const { src, srcSet, srcMap } = cloudflare.image(photo.url, {
  width: [600, 1200],
  format: ['webp', 'jpg']
})
```

Format negotiation by the `Accept` header, instead of format variants:

```ts
const cloudflare = new Cloudflare({
  processing: ({ width }) => `width=${width},format=auto`
})
```

Passthrough mode - untouched source urls, e.g. for local development outside of a Cloudflare zone:

```ts
const cloudflare = new Cloudflare({
  passthrough: import.meta.env.DEV
})
```

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/proxies/cloudflare/).
