# @srcset/react

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Freact.svg
[npm-url]: https://npmjs.com/package/@srcset/react

[node]: https://img.shields.io/node/v/%40srcset%2Freact.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Freact
[deps-url]: https://libraries.io/npm/%40srcset%2Freact

[size]: https://deno.bundlejs.com/badge?q=%40srcset%2Freact
[size-url]: https://bundlejs.com/?q=%40srcset%2Freact

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://img.shields.io/codecov/c/github/TrigenSoftware/srcset.svg
[coverage-url]: https://app.codecov.io/gh/TrigenSoftware/srcset

React components for responsive images: Picture and Image.

- 🖼 `<picture>` sources grouped by mime type and ordered by format efficiency
- 🚀 Lazy loading and async decoding by default, `priority` for above-the-fold images
- 🌫 Blur-up placeholder background until the image loads
- 📐 Anti-CLS: intrinsic size from the image variant

## Install

```bash
# pnpm
pnpm add @srcset/react @srcset/runtime
# yarn
yarn add @srcset/react @srcset/runtime
# npm
npm i @srcset/react @srcset/runtime
```

## Usage

```tsx
import { src, srcSet, placeholder } from './photo.jpg'
import { Picture, Image } from '@srcset/react'

function Hero() {
  return (
    <Picture srcSet={srcSet}>
      <Image
        alt='Hero photo'
        src={src}
        placeholder={placeholder}
      />
    </Picture>
  )
}
```

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/components/).
