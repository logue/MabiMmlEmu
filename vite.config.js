import { fileURLToPath, URL } from 'node:url';

import { checker } from 'vite-plugin-checker';
import { defineConfig } from 'vite';
import banner from 'vite-plugin-banner';

import pkg from './package.json';

// Export vite config
export default defineConfig(async ({ mode }) => {
  /** @type {UserConfig} https://vitejs.dev/config/ */
  const config = {
    // https://vitejs.dev/config/#base
    base: './',
    // Resolver
    resolve: {
      // https://vitejs.dev/config/shared-options.html#resolve-alias
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '~': fileURLToPath(new URL('./node_modules', import.meta.url)),
        buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        url: 'rollup-plugin-node-polyfills/polyfills/url',
      },
    },
    // https://vitejs.dev/config/#server-options
    server: {
      fs: {
        // Allow serving files from one level up to the project root
        allow: ['..'],
      },
    },
    plugins: [
      // vite-plugin-checker
      // https://github.com/fi3ework/vite-plugin-checker
      checker({
        typescript: false,
        vueTsc: false,
        eslint: {
          lintCommand: `eslint`, // for example, lint .ts & .tsx
        },
      }),
      // vite-plugin-banner
      // https://github.com/chengpeiquan/vite-plugin-banner
      banner(`/**
 * ${pkg.name}
 *
 * @description ${pkg.description}
 * @author Logue
 * @copyright 2006-2013, 2015, 2018, 2019, 2022-2023 Masashi Yoshikawa
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @see {@link ${pkg.homepage}}
 */
  `),
    ],
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis', // <-- AWS SDK
        },
      },
    },
    // Build Options
    // https://vitejs.dev/config/#build-options
    build: {
      outDir: 'dist',
      // Minify option
      // https://vitejs.dev/config/#build-minify
      rollupOptions: {
        input: {
          index: fileURLToPath(new URL('index.html', import.meta.url)),
          wml: fileURLToPath(new URL('wml.html', import.meta.url)),
        },
      },
      minify: 'esbuild',
    },
    esbuild: {
      drop: mode === 'serve' ? [] : ['console'],
    },
  };
  return config;
});
