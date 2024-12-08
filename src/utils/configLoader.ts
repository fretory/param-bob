import yaml from 'js-yaml'
import { Command, ToolConfig } from '@/types/config'

export async function loadConfig(): Promise<ToolConfig> {
  try {
    const basePath = import.meta.env.BASE_URL || '/'
    const configPath = `${basePath}config/tools.yaml`
    
    const response = await fetch(configPath)
    if (!response.ok) {
      console.error(`Failed to fetch config from ${configPath}`)
      throw new Error(`Failed to load config: ${response.statusText}`)
    }
    
    const yamlText = await response.text()
    const commands = yaml.load(yamlText) as Command[]
    
    if (!Array.isArray(commands)) {
      console.error('Config is not an array:', commands)
      return { commands: [] }
    }
    
    return { commands }
  } catch (error) {
    console.error('Error loading config:', error)
    return { commands: [] }
  }
} 