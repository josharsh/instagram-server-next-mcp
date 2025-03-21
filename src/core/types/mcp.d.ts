declare module 'mcp' {
  export interface McpRequest<T = any> {
  params: T;
}

export interface McpResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export class Server {
  constructor(
    config: {
      name: string;
      version: string;
    },
    options: {
      capabilities: {
        resources: Record<string, any>;
        tools: Record<string, any>;
      };
    }
  );
  setRequestHandler(schema: any, handler: (request: McpRequest) => Promise<any>): void;
  connect(transport: any): Promise<void>;
}

export class StdioServerTransport {
  constructor();
}

export enum ErrorCode {
  InvalidRequest = 'InvalidRequest',
  MethodNotFound = 'MethodNotFound',
  InvalidParams = 'InvalidParams',
  InternalError = 'InternalError'
}

export class McpError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string);
}

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ResourceSchema {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface ResourceTemplateSchema {
  uriTemplate: string;
  name: string;
  mimeType?: string;
  description?: string;
}

export interface CallToolRequestSchema {
  name: string;
  arguments: Record<string, any>;
}

export interface ListToolsRequestSchema {
  tools: ToolSchema[];
}

export interface ListResourcesRequestSchema {
  resources: ResourceSchema[];
}

export interface ListResourceTemplatesRequestSchema {
  resourceTemplates: ResourceTemplateSchema[];
}

export interface ReadResourceRequestSchema {
  uri: string;
}
}
