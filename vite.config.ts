import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const publicSite = (process.env.VITE_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'absolute-default-og-image',
      transformIndexHtml(html) {
        if (!publicSite) return html
        return html.replace(
          /<meta\s+property="og:image"\s+content="\/site-logo\.jpg"\s*\/>/,
          `<meta property="og:image" content="${publicSite}/site-logo.jpg" />`,
        )
      },
    },
  ],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
