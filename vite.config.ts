import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'


export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  }, 
  css: {
    devSourcemap: true,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      global: 'globalthis'
    }
  },
  define: {
    global: 'globalThis',
    __APP_ENV__: process.env.VITE_APP_ENV,
  }
})
