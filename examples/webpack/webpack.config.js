import HtmlWebpackPlugin from 'html-webpack-plugin'

const root = import.meta.dirname

export default {
  cache: {
    type: 'filesystem'
  },
  entry: `${root}/src/index.jsx`,
  output: {
    path: `${root}/dist`,
    clean: true
  },
  resolve: {
    extensions: [
      '...',
      '.ts',
      '.tsx',
      '.jsx'
    ]
  },
  module: {
    rules: [
      {
        // The app code is JSX, and the workspace packages resolve to their
        // TypeScript sources in this repo - one rule covers both. An installed
        // package ships compiled JS and needs none of this.
        test: /\.[jt]sx?$/,
        loader: 'swc-loader',
        options: {
          jsc: {
            target: 'es2022',
            // Tsx parses the app JSX as well - it is a superset of it.
            parser: {
              syntax: 'typescript',
              tsx: true
            },
            transform: {
              react: {
                // No `import { h }` needed in the components.
                runtime: 'automatic',
                importSource: 'preact'
              }
            }
          }
        }
      },
      {
        // Every image import goes through the loader - no query marker required.
        test: /\.(jpe?g|png|gif)$/i,
        use: {
          loader: '@srcset/loader',
          options: {
            // The first matching rule wins. A rule in the import query
            // replaces this whole set - see demo 1 in `src/App.jsx`.
            rules: [
              // png: keep the format (transparency) and add webp.
              {
                match: '**/*.png',
                width: [1, 0.5],
                format: ['png', 'webp']
              },
              // gif: keep the format (animation) and add webp - both keep all frames.
              {
                match: '**/*.gif',
                width: [1, 0.5],
                format: ['gif', 'webp']
              },
              // Everything else - photos: jpg fallback, plus webp and avif.
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
    new HtmlWebpackPlugin({
      template: `${root}/index.html`
    })
  ],
  devServer: {
    port: 5175
  }
}
