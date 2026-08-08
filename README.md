# srcset

[![Build status][build]][build-url]
[![Coverage status][coverage]][coverage-url]

[build]: https://img.shields.io/github/actions/workflow/status/TrigenSoftware/srcset/tests.yml?branch=main
[build-url]: https://github.com/TrigenSoftware/srcset/actions

[coverage]: https://coveralls.io/repos/github/TrigenSoftware/srcset/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/TrigenSoftware/srcset?branch=main

Highly customizable tools for generating [responsive images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images): build-time generation, image proxy adapters and framework components - without vendor and server lock-in.

- 🌠 Resize images for different screen sizes and densities
- 📸 Convert images to [modern formats](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#use_modern_image_formats_boldly) such as [WebP](https://developers.google.com/speed/webp) and [Avif](https://jakearchibald.com/2020/avif-has-landed/)
- ⚡️ Powered by [sharp](https://sharp.pixelplumbing.com/)
- 🧩 [Webpack](https://webpack.js.org/), [Rspack](https://rspack.rs/) and [Vite](https://vite.dev/) integrations
- 🖼 Сomponents for React, Preact and Svelte: blur-up placeholders, priority loading, tree-shakable image modules
- 🌐 Image proxy adapters - [imgproxy](https://imgproxy.net/) and [Cloudflare](https://developers.cloudflare.com/images/) - runtime srcset urls for content images, e.g. from an API or a CMS

For more details, guides and API references, check out the [documentation website](https://srcset.js.org).

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@srcset/core`](packages/core#readme) | Image processing: resize, convert and optimize images with sharp. | [![NPM version][core-npm]][core-npm-url] |
| [`@srcset/cli`](packages/cli#readme) | Command line tool to generate responsive images. | [![NPM version][cli-npm]][cli-npm-url] |
| [`@srcset/runtime`](packages/runtime#readme) | Browser runtime helpers: srcset strings and attributes of image variants. | [![NPM version][runtime-npm]][runtime-npm-url] |
| [`@srcset/loader`](packages/loader#readme) | Webpack and Rspack loader for generating responsive images. | [![NPM version][loader-npm]][loader-npm-url] |
| [`@srcset/vite-plugin`](packages/vite-plugin#readme) | Vite plugin for generating responsive images. | [![NPM version][vite-plugin-npm]][vite-plugin-npm-url] |
| [`@srcset/imgproxy`](packages/imgproxy#readme) | Adapter for imgproxy: srcset variant urls for content images, e.g. from an API or a CMS. | [![NPM version][imgproxy-npm]][imgproxy-npm-url] |
| [`@srcset/cloudflare`](packages/cloudflare#readme) | Adapter for Cloudflare image transformations: srcset variant urls for content images, e.g. from an API or a CMS. | [![NPM version][cloudflare-npm]][cloudflare-npm-url] |
| [`@srcset/react`](packages/react#readme) | React components for responsive images: Picture and Image. | [![NPM version][react-npm]][react-npm-url] |
| [`@srcset/preact`](packages/preact#readme) | Preact components for responsive images: Picture and Image. | [![NPM version][preact-npm]][preact-npm-url] |
| [`@srcset/svelte`](packages/svelte#readme) | Svelte components for responsive images: Picture and Image. | [![NPM version][svelte-npm]][svelte-npm-url] |

<!-- core -->

[core-npm]: https://img.shields.io/npm/v/%40srcset%2Fcore.svg
[core-npm-url]: https://npmjs.com/package/@srcset/core

<!-- cli -->

[cli-npm]: https://img.shields.io/npm/v/%40srcset%2Fcli.svg
[cli-npm-url]: https://npmjs.com/package/@srcset/cli

<!-- runtime -->

[runtime-npm]: https://img.shields.io/npm/v/%40srcset%2Fruntime.svg
[runtime-npm-url]: https://npmjs.com/package/@srcset/runtime

<!-- loader -->

[loader-npm]: https://img.shields.io/npm/v/%40srcset%2Floader.svg
[loader-npm-url]: https://npmjs.com/package/@srcset/loader

<!-- vite-plugin -->

[vite-plugin-npm]: https://img.shields.io/npm/v/%40srcset%2Fvite-plugin.svg
[vite-plugin-npm-url]: https://npmjs.com/package/@srcset/vite-plugin

<!-- imgproxy -->

[imgproxy-npm]: https://img.shields.io/npm/v/%40srcset%2Fimgproxy.svg
[imgproxy-npm-url]: https://npmjs.com/package/@srcset/imgproxy

<!-- cloudflare -->

[cloudflare-npm]: https://img.shields.io/npm/v/%40srcset%2Fcloudflare.svg
[cloudflare-npm-url]: https://npmjs.com/package/@srcset/cloudflare

<!-- react -->

[react-npm]: https://img.shields.io/npm/v/%40srcset%2Freact.svg
[react-npm-url]: https://npmjs.com/package/@srcset/react

<!-- preact -->

[preact-npm]: https://img.shields.io/npm/v/%40srcset%2Fpreact.svg
[preact-npm-url]: https://npmjs.com/package/@srcset/preact

<!-- svelte -->

[svelte-npm]: https://img.shields.io/npm/v/%40srcset%2Fsvelte.svg
[svelte-npm-url]: https://npmjs.com/package/@srcset/svelte
