import { rspack } from '@rspack/core'

export default {
  cache: {
    type: 'persistent'
  },
  context: import.meta.dirname,
  entry: './src/index.jsx',
  output: {
    path: `${import.meta.dirname}/dist`,
    clean: true
  },
  module: {
    rules: [
      {
        // The app code is JSX, and the workspace packages resolve to their
        // TypeScript sources in this repo - one rule covers both, swc infers
        // the syntax from the extension. An installed package ships compiled
        // JS and needs none of this.
        test: /\.[jt]sx?$/,
        loader: 'builtin:swc-loader',
        options: {
          detectSyntax: 'auto',
          jsc: {
            transform: {
              react: {
                // No `import React` needed in the components.
                runtime: 'automatic'
              }
            }
          }
        }
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        use: {
          loader: '@srcset/loader',
          options: {
            rules: [
              // Png: keep png as the fallback so transparency survives, add webp.
              {
                match: '**/*.png',
                width: [1, 0.5],
                format: ['png', 'webp']
              },
              // Gif: keep gif as the fallback, add animated webp.
              {
                match: '**/*.gif',
                width: [1, 0.5],
                format: ['gif', 'webp']
              },
              // Everything else - photos. The import query of the first demo overrides this rule.
              {
                width: [1, 0.5],
                format: ['jpg', 'webp', 'avif']
              }
            ]
          }
        }
      }
    ]
  },
  plugins: [
    // Rspack's built-in html plugin - no html-webpack-plugin needed.
    new rspack.HtmlRspackPlugin({
      template: './index.html'
    })
  ]
}
