# @srcset/cli

[![ESM-only package][package]][package-url]
[![NPM version][npm]][npm-url]
[![Node version][node]][node-url]
[![Dependencies status][deps]][deps-url]
[![Install size][size]][size-url]
[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[package]: https://img.shields.io/badge/package-ESM--only-ffe536.svg
[package-url]: https://nodejs.org/api/esm.html

[npm]: https://img.shields.io/npm/v/%40srcset%2Fcli.svg
[npm-url]: https://npmjs.com/package/@srcset/cli

[node]: https://img.shields.io/node/v/%40srcset%2Fcli.svg
[node-url]: https://nodejs.org

[deps]: https://img.shields.io/librariesio/release/npm/%40srcset%2Fcli
[deps-url]: https://libraries.io/npm/%40srcset%2Fcli

[size]: https://packagephobia.com/badge?p=%40srcset%2Fcli
[size-url]: https://packagephobia.com/result?p=%40srcset%2Fcli

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://img.shields.io/codecov/c/github/TrigenSoftware/srcset.svg
[coverage-url]: https://app.codecov.io/gh/TrigenSoftware/srcset

Command line tool to generate responsive images.

- 🌠 Resize images for different screen sizes and densities
- 📸 Convert images to [modern formats](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#use_modern_image_formats_boldly) such as [WebP](https://developers.google.com/speed/webp) and [Avif](https://jakearchibald.com/2020/avif-has-landed/)
- ⚡️ Powered by [sharp](https://sharp.pixelplumbing.com/)
- 🎯 Glob sources, match rules and `srcset.config.js` configuration

## Install

```bash
# pnpm
pnpm add -D @srcset/cli
# yarn
yarn add -D @srcset/cli
# npm
npm i -D @srcset/cli
```

## Usage

```bash
npx srcset "src/images/*.jpg" --width 1920,1280,860,320 --format avif,webp,jpg -d static/images
```

Or with the `srcset.config.js` configuration file:

```js
export default {
  src: 'src/images/**/*.jpg',
  dest: 'static/images',
  rules: [
    {
      match: '(min-width: 1920px)',
      width: [1920, 1280, 860, 320],
      format: ['avif', 'webp', 'jpg']
    }
  ]
}
```

## Documentation

For more details, guides and API references, check out the [documentation website](https://srcset.js.org/integrations/cli/).
