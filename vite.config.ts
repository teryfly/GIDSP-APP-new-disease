import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5179,
  },
  // 添加基础路径配置，支持部署在子路径下
  base: './',
  build: {
    // 确保资源路径正确
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 确保入口文件名一致
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
})