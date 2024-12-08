import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'node:fs'

// 创建一个插件来复制配置文件
const copyConfigPlugin = () => {
  return {
    name: 'copy-config',
    closeBundle: () => {
      // 确保目标目录存在
      if (!fs.existsSync('dist/config')) {
        fs.mkdirSync('dist/config', { recursive: true })
      }
      
      // 复制配置文件
      if (fs.existsSync('config/tools.yaml')) {
        fs.copyFileSync('config/tools.yaml', 'dist/config/tools.yaml')
      }
      if (fs.existsSync('config/tools.json')) {
        fs.copyFileSync('config/tools.json', 'dist/config/tools.json')
      }
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    copyConfigPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000
  },
  base: process.env.NODE_ENV === 'production' ? '/param-bob/' : '/'
}) 