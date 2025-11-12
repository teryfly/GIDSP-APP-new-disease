import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    // 关键配置：确保完全编译，移除 import.meta
    target: 'es2015',
    // 禁用代码分割，确保单一bundle
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    },
    // 确保所有模块都被编译
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  // 预览时也使用相对路径
  preview: {
    port: 5179
  }
})