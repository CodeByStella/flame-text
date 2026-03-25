import { defineConfig } from 'vite'
import { resolve } from 'node:path'

/** Dev server + demo app */
export default defineConfig({
  root: 'demo',
  publicDir: resolve(__dirname, 'demo/public'),
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
