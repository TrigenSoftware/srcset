# Changelog

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 1.0.0 (2026-09-03)

### Features

* **bundler-utils,vite-plugin:** serve and cache variants via the core cache storage ([#9](https://github.com/TrigenSoftware/srcset/issues/9)) ([1f6e9dc](https://github.com/TrigenSoftware/srcset/commit/1f6e9dcb6ab48ac2a12a09ad938c52367fb4ad89))
* **bundler-utils:** add shared bundler machinery ([#5](https://github.com/TrigenSoftware/srcset/issues/5)) ([fd072e6](https://github.com/TrigenSoftware/srcset/commit/fd072e6c76b6aef9e5cbdd5a2ce668e145881c03))
* **cli,bundler-utils:** bake image modules with the `--module` flag ([#23](https://github.com/TrigenSoftware/srcset/issues/23)) ([418df42](https://github.com/TrigenSoftware/srcset/commit/418df428231bc4899331fc4b464ebf5a089e8029))
* **cli:** add `--placeholder` and `--select-*` flags ([#30](https://github.com/TrigenSoftware/srcset/issues/30)) ([60c1430](https://github.com/TrigenSoftware/srcset/commit/60c1430b7a995875ad50fe0f798b3b91cfb566fd))
* **cli:** add command line tool ([#2](https://github.com/TrigenSoftware/srcset/issues/2)) ([cc5c841](https://github.com/TrigenSoftware/srcset/commit/cc5c8413f5207e8aca447871518b11ab75b2a4cc))
* **cloudflare:** add Cloudflare runtime srcset builder ([#15](https://github.com/TrigenSoftware/srcset/issues/15)) ([5289e7b](https://github.com/TrigenSoftware/srcset/commit/5289e7b4cc48fd67b156b8853561d22e66c3443e))
* configure and prune the disk cache ([#19](https://github.com/TrigenSoftware/srcset/issues/19)) ([5f81e2d](https://github.com/TrigenSoftware/srcset/commit/5f81e2d90bbee19ddc1b9ff2bfb551b534438733))
* **core:** add image processing engine ([#1](https://github.com/TrigenSoftware/srcset/issues/1)) ([7ddce44](https://github.com/TrigenSoftware/srcset/commit/7ddce44f981a25f71a473f26b0a7471e957944f4))
* **core:** disk cache storage for generated variants ([#8](https://github.com/TrigenSoftware/srcset/issues/8)) ([4a1bf7d](https://github.com/TrigenSoftware/srcset/commit/4a1bf7dd8d780f6d15ebbaa3f960041ce8fa021f))
* **imgproxy:** add imgproxy runtime srcset builder ([#13](https://github.com/TrigenSoftware/srcset/issues/13)) ([5b93f0c](https://github.com/TrigenSoftware/srcset/commit/5b93f0c6f3a5177c476817b5d7c369f5dfc0ab4e))
* **loader:** add the disk cache option ([#17](https://github.com/TrigenSoftware/srcset/issues/17)) ([7675bbc](https://github.com/TrigenSoftware/srcset/commit/7675bbce39c2b5b75c21d202f62f56b4f97c87f7))
* **loader:** add webpack and Rspack loader ([#6](https://github.com/TrigenSoftware/srcset/issues/6)) ([79a0a82](https://github.com/TrigenSoftware/srcset/commit/79a0a8215162be9ce134754e5486366c23efd9fd))
* **preact:** add Preact components ([#11](https://github.com/TrigenSoftware/srcset/issues/11)) ([e2c45ee](https://github.com/TrigenSoftware/srcset/commit/e2c45eefa4f27088fb7b546f18f24ca2203f5722))
* **react:** add React components ([#10](https://github.com/TrigenSoftware/srcset/issues/10)) ([999d442](https://github.com/TrigenSoftware/srcset/commit/999d44295b68facebc555ba09c426d7c0e6e262a))
* rules apply first match by default with fallthrough opt-in ([a044cb2](https://github.com/TrigenSoftware/srcset/commit/a044cb24fa181f5da595498fe8b0671444f6e546))
* **runtime:** add browser runtime helpers ([#4](https://github.com/TrigenSoftware/srcset/issues/4)) ([9366144](https://github.com/TrigenSoftware/srcset/commit/9366144e1ca5f5287c7ffdbf443c71afe751881b))
* **svelte:** add Svelte components ([#12](https://github.com/TrigenSoftware/srcset/issues/12)) ([1a0280b](https://github.com/TrigenSoftware/srcset/commit/1a0280bbc98e370081d71c564f678f611ca77e24))
* **vite-plugin:** add Vite plugin ([#7](https://github.com/TrigenSoftware/srcset/issues/7)) ([be02c44](https://github.com/TrigenSoftware/srcset/commit/be02c44976c954d1e1511306e5b186b4a4aa1471))

### Bug Fixes

* address the code review findings ([#16](https://github.com/TrigenSoftware/srcset/issues/16)) ([1a1bad3](https://github.com/TrigenSoftware/srcset/commit/1a1bad37c6e310052fa15fdad39819296feb3cdc))
* **cli:** keep a brace glob of `--match` in one piece ([#29](https://github.com/TrigenSoftware/srcset/issues/29)) ([8621c57](https://github.com/TrigenSoftware/srcset/commit/8621c57d737dcc66a9d456009de17235831c382e))
* **imgproxy,cloudflare:** select `src` the way a generation rule does ([#39](https://github.com/TrigenSoftware/srcset/issues/39)) ([b1dd2a0](https://github.com/TrigenSoftware/srcset/commit/b1dd2a0e94477f709173c53268c8abcaab686295))
* **react:** drop the preload from `priority` ([#37](https://github.com/TrigenSoftware/srcset/issues/37)) ([bb18209](https://github.com/TrigenSoftware/srcset/commit/bb18209d02582b3f6a34533d382c573cf6e0dfda))
