import { defineConfig } from 'astro/config'
import { unified } from '@astrojs/markdown-remark'
import starlight from '@astrojs/starlight'
import llmsTxt from 'starlight-llms-txt'
import { viewTransitions } from 'astro-vtbot/starlight-view-transitions'
import { rehypeNormalizeContent } from './rehype.js'

export default defineConfig({
  site: 'https://srcset.js.org',
  markdown: {
    processor: unified({
      rehypePlugins: [rehypeNormalizeContent]
    })
  },
  integrations: [
    starlight({
      title: 'srcset',
      description: 'Highly customizable tools for generating responsive images: build-time generation, image proxy adapters and framework components - without vendor and server lock-in.',
      favicon: '/favicon.svg',
      head: [
        {
          // GitHub Pages can't set COOP/COEP headers, which StackBlitz
          // WebContainers embeds require; this service worker injects them
          tag: 'script',
          attrs: {
            src: '/coi-serviceworker.js'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'format-detection',
            content: 'telephone=no'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: 'https://srcset.js.org/og-image.jpg'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:width',
            content: '1200'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:height',
            content: '630'
          }
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:type',
            content: 'image/jpeg'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:card',
            content: 'summary_large_image'
          }
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: 'https://srcset.js.org/og-image.jpg'
          }
        }
      ],
      social: [
        {
          label: 'GitHub',
          icon: 'github',
          href: 'https://github.com/TrigenSoftware/srcset'
        }
      ],
      editLink: {
        baseUrl: 'https://github.com/TrigenSoftware/srcset/edit/main/website/'
      },
      plugins: [llmsTxt(), viewTransitions()],
      sidebar: [
        {
          label: 'Getting Started',
          items: [{
            autogenerate: {
              directory: 'getting-started'
            }
          }]
        },
        {
          label: 'Integrations',
          items: [{
            autogenerate: {
              directory: 'integrations'
            }
          }]
        },
        {
          label: 'Components',
          link: '/components/'
        },
        {
          label: 'Proxies',
          items: [{
            autogenerate: {
              directory: 'proxies'
            }
          }]
        },
        {
          label: 'API',
          items: [{
            autogenerate: {
              directory: 'api'
            }
          }]
        },
        {
          label: 'Examples',
          items: [{
            autogenerate: {
              directory: 'examples'
            }
          }]
        }
      ],
      customCss: ['./src/styles/global.css'],
      expressiveCode: {
        themes: ['github-dark-high-contrast', 'github-light-default'],
        frames: {
          extractFileNameFromCode: false
        }
      }
    })
  ]
})
