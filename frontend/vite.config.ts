import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/onemap': {
        target: 'https://www.onemap.gov.sg',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/onemap/, ''),
      },
    },
  },
})
