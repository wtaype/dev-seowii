// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: true,
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  prefetch: {
    defaultStrategy: 'hover'
  },
  build: {
    inlineStylesheets: 'always'
  },
  vite: {
    build: {
      cssMinify: true,
      minify: 'esbuild'
    }
  }
});
