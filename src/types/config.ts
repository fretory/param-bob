export interface ToolConfig {
  // 工具基础信息
  name: string;                 // 工具名称，例如: "tools"
  description?: string;         // 工具描述
  version?: string;            // 工具版本
  globalParameters?: Parameter[]; // 全局参数配置
  commands: Command[];         // 命令列表
}

export interface Command {
  name: string;
  description: string;
  tags?: string[];
  parameters?: Parameter[];
  subCommands?: SubCommand[];
}

export interface SubCommand {
  name: string;
  description: string;
  parameters?: Parameter[];
  subCommands?: SubSubCommand[];
}

export interface SubSubCommand {
  name: string;
  description: string;
  parameters: Parameter[];
}

export interface Parameter {
  param: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string;
  value?: string;
  enabled?: boolean;
} 