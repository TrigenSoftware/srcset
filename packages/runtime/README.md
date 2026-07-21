# @srcset/runtime

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Fruntime.svg
[npm-url]: https://npmjs.com/package/@srcset/runtime

[node]: https://img.shields.io/node/v/%40srcset%2Fruntime.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Fruntime
[deps-url]: https://libraries.io/npm/%40srcset%2Fruntime

[size]: https://deno.bundlejs.com/badge?q=%40srcset%2Fruntime
[size-url]: https://bundlejs.com/?q=%40srcset%2Fruntime

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://img.shields.io/codecov/c/github/TrigenSoftware/srcset.svg
[coverage-url]: https://app.codecov.io/gh/TrigenSoftware/srcset

Browser runtime helpers of [srcset](https://github.com/TrigenSoftware/srcset#readme): srcset strings and attributes of image variants.

- 🖼 Build `srcset` strings and `<img>`/`<source>` attributes from image variants
- 🌳 Zero dependencies, tree-shakable, less than 1 kB

## Install

```bash
# pnpm
pnpm add @srcset/runtime
# yarn
yarn add @srcset/runtime
# npm
npm i @srcset/runtime
```

## Usage

```ts
import url, { src, srcSet } from './photo.jpg'
import { getImageProps, getSourceProps } from '@srcset/runtime'

const { src: imgSrc, srcSet: imgSrcSet } = getImageProps(src, srcSet)
// <img src={imgSrc} srcSet={imgSrcSet}/>

const sources = getSourceProps(srcSet)
// sources of <picture>, grouped by mime type and ordered by format efficiency
```

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/api/runtime/).
