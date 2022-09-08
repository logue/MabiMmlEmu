import { defineConfig } from 'vite';
import { checker } from 'vite-plugin-checker';
import banner from 'vite-plugin-banner';
import path from 'path';

const pkg = require('./package.json');

/**
 * @see {@link https://vitejs.dev/config/}
 * @type {import('vite').UserConfig}
 */
const config = {
  base: './',
  // Resolver
  resolve: {
    // https://vitejs.dev/config/shared-options.html#resolve-alias
    alias: {
      '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
      '~bootstrap-icons': path.resolve(
        __dirname,
        'node_modules/bootstrap-icons'
      ),
      '~dseg': path.resolve(__dirname, 'node_modules/dseg'),
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
        lintCommand: 'eslint', // for example, lint .ts & .tsx
      },
    }),
    // vite-plugin-banner
    // https://github.com/chengpeiquan/vite-plugin-banner
    banner(`/**
 * ${pkg.name}
 *
 * @description ${pkg.description}
 * @author ${pkg.author.name} <${pkg.author.email}>
 * @copyright 2007-2013, 2015, 2018, 2019, 2022 By Masashi Yoshikawa All rights reserved.
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @see {@link ${pkg.homepage}}
 */
`),
  ],
  // Build Options
  // https://vitejs.dev/config/#build-options
  build: {
    outDir: 'dist',
    target: 'es2021',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        wml: path.resolve(__dirname, 'wml.html'),
      },
    },
  },
};

// Export vite config
export default defineConfig(config);
