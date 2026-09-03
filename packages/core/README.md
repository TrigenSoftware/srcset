# @srcset/core

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Fcore.svg
[npm-url]: https://npmjs.com/package/@srcset/core

[node]: https://img.shields.io/node/v/%40srcset%2Fcore.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Fcore
[deps-url]: https://libraries.io/npm/%40srcset%2Fcore

[size]: https://packagephobia.com/badge?p=%40srcset%2Fcore
[size-url]: https://packagephobia.com/result?p=%40srcset%2Fcore

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/srcset/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/srcset?branch=main

Image processing engine of [srcset](https://github.com/TrigenSoftware/srcset#readme): resize, convert and optimize images with [sharp](https://sharp.pixelplumbing.com/).

- 🌠 Resize images for different screen sizes and densities
- 📸 Convert images to modern formats such as [WebP](https://developers.google.com/speed/webp) and [Avif](https://jakearchibald.com/2020/avif-has-landed/)
- 🎯 Match images by glob patterns and media queries
- ⚡️ Concurrency-limited single-pass encoding

## Install

```bash
# pnpm
pnpm add -D @srcset/core
# yarn
yarn add -D @srcset/core
# npm
npm i -D @srcset/core
```

## Usage

```ts
import { readFile, writeFile } from 'node:fs/promises'
import { SrcSetGenerator } from '@srcset/core'

const generator = new SrcSetGenerator()
const source = {
  path: 'images/photo.jpg',
  contents: await readFile('images/photo.jpg')
}

for await (const image of generator.generate(source, {
  width: [1, 0.5, 320],
  format: ['avif', 'webp', 'jpg']
})) {
  await writeFile(`dist/${image.path.split('/').pop()}`, image.contents)
}
```

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/api/core/).
