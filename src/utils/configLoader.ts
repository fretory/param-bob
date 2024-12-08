import yaml from 'js-yaml'
import type { ToolConfig, Parameter } from '../types/config'

export async function loadConfig(path: string): Promise<ToolConfig> {
  const response = await fetch(path)
  const content = await response.text()
  
  let config: ToolConfig
  if (path.endsWith('.yaml') || path.endsWith('.yml')) {
    config = yaml.load(content) as ToolConfig
  } else {
    config = JSON.parse(content)
  }

  // 初始化全局参数的值
  if (config.globalParameters) {
    config.globalParameters = config.globalParameters.map(param => ({
      ...param,
      value: param.default || ''
    }))
  }

  return config
} 