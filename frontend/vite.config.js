import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // Allows access from your local network
    port: 5173, // Specify the port (default: 5173)
    open: true, // Open the browser automatically
  },
  plugins: [vue(), vueDevTools()],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
