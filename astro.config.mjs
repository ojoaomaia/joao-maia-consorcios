import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/* Endereço do site: a Netlify informa sozinha na variável URL (ex.: https://joaomaiaconsorcios.com.br).
   Ele é usado no canonical, na prévia de compartilhamento e no sitemap. */
const SITE = process.env.URL || process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/admin/') })],
  devToolbar: { enabled: false }
});
