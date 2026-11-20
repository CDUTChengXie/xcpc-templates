import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// 需求文档：内容放在 content/<章>/<板子>.md，导航与搜索索引由构建脚本生成。
// 这里把 data/ 直接当静态资源，让 JSON 可被 fetch。
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  publicDir: 'public',
  server: { port: 5173, open: true },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['react', 'react-dom'] },
      },
    },
  },
})