import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeProject from './src/plugins/rehype-project.mjs';

export default defineConfig({
  site: 'https://www.doughindson.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeProject],
  },
});
