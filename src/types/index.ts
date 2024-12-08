export interface Parameter {
  param: string;
  type: string;
  description: string;
  required: boolean;
  value?: any;
}

export interface SubSubCommand {
  name: string;
  description: string;
  parameters: Parameter[];
}

export interface SubCommand {
  name: string;
  description: string;
  parameters?: Parameter[];
  subCommands?: SubSubCommand[];
}

export interface Tool {
  name: string;
  description: string;
  tags: string[];
  subCommands?: SubCommand[];
  parameters?: Parameter[];
} 