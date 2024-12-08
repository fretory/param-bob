import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'node:fs'

const copyConfigPlugin = () => {
  return {
    name: 'copy-config',
    closeBundle: () => {
      const distConfigDir = resolve(__dirname, 'dist/config')
      // 确保目标目录存在
      if (!fs.existsSync(distConfigDir)) {
        fs.mkdirSync(distConfigDir, { recursive: true })
      }
      
      // 复制配置文件
      const sourceYaml = resolve(__dirname, 'config/tools.yaml')
      const targetYaml = resolve(distConfigDir, 'tools.yaml')
      
      if (fs.existsSync(sourceYaml)) {
        fs.copyFileSync(sourceYaml, targetYaml)
        console.log('Copied tools.yaml to dist/config/')
      } else {
        console.warn('tools.yaml not found in config directory')
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