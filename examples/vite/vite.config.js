import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { srcset } from '@srcset/vite-plugin'

export default defineConfig({
  plugins: [
    svelte(),
    srcset({
      // Default rules for every processed image import.
      // A rule in the import query replaces them for that import.
      rules: [
        // Photos: full and half width, jpg first - it is the `src` fallback.
        {
          match: '**/*.jpg',
          width: [1, 0.5],
          format: ['jpg', 'webp', 'avif']
        },
        // Stickers: png stays for the transparency, webp is the smaller twin.
        {
          match: '**/*.png',
          width: [1, 0.5],
          format: ['png', 'webp']
        },
        // Animations: gif stays for the widest support, webp keeps all the frames.
        {
          match: '**/*.gif',
          width: [1, 0.5],
          format: ['gif', 'webp']
        }
      ]
    })
  ],
  optimizeDeps: {
    // `@srcset/svelte` resolves to its workspace source through the `svelte` export
    // condition, so the svelte plugin must compile it instead of vite prebundling it.
    exclude: ['@srcset/svelte']
  }
})
