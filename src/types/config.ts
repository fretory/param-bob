export interface Parameter {
  param: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string;
  value?: string;
  enabled?: boolean;
}

export interface SubCommand {
  name: string;
  description: string;
  template: string;
  parameters?: Parameter[];
  subCommands?: SubCommand[];
}

export interface Command {
  name: string;
  description: string;
  template: string;
  tags?: string[];
  parameters?: Parameter[];
  globalParams?: Parameter[];
  subCommands?: SubCommand[];
}

export interface ToolConfig {
  commands: Command[];
  globalParameters?: Parameter[];
} 