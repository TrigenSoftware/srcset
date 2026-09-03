# @srcset/bundler-utils

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Fbundler-utils.svg
[npm-url]: https://npmjs.com/package/@srcset/bundler-utils

[node]: https://img.shields.io/node/v/%40srcset%2Fbundler-utils.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Fbundler-utils
[deps-url]: https://libraries.io/npm/%40srcset%2Fbundler-utils

[size]: https://packagephobia.com/badge?p=%40srcset%2Fbundler-utils
[size-url]: https://packagephobia.com/result?p=%40srcset%2Fbundler-utils

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/srcset/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/srcset?branch=main

Shared machinery of the [srcset](https://github.com/TrigenSoftware/srcset#readme) bundler integrations: import query parsing and image module codegen.

- 🧩 Build custom bundler integrations on top of `generateSrcSetModule`

## Install

```bash
# pnpm
pnpm add -D @srcset/bundler-utils
# yarn
yarn add -D @srcset/bundler-utils
# npm
npm i -D @srcset/bundler-utils
```

## Usage

```ts
import { parseResourceQuery, generateSrcSetModule } from '@srcset/bundler-utils'

const query = parseResourceQuery(resourceQuery)
const module = await generateSrcSetModule(source, query, options, emitImage, limit)
// ES module code: default url, src, srcSet, srcMap and placeholder exports
```

You probably need [@srcset/loader](https://npmjs.com/package/@srcset/loader) or [@srcset/vite-plugin](https://npmjs.com/package/@srcset/vite-plugin) instead, unless you are building an integration.

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org).
