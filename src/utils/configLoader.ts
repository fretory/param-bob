import yaml from 'js-yaml'
import { ToolConfig } from '@/types/config'

export async function loadConfig(): Promise<ToolConfig[]> {
  try {
    // 根据环境构建正确的配置文件路径
    const basePath = import.meta.env.BASE_URL || '/'
    const configPath = `${basePath}config/tools.yaml`
    
    const response = await fetch(configPath)
    if (!response.ok) {
      console.error(`Failed to fetch config from ${configPath}`)
      throw new Error(`Failed to load config: ${response.statusText}`)
    }
    
    const yamlText = await response.text()
    const config = yaml.load(yamlText) as ToolConfig[]
    
    if (!Array.isArray(config)) {
      console.error('Config is not an array:', config)
      return []
    }
    
    return config
  } catch (error) {
    console.error('Error loading config:', error)
    return []
  }
} 