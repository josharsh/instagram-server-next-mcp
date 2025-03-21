export interface IBrowserConfig {
  headless: boolean;
  windowWidth: number;
  windowHeight: number;
  defaultTimeout: number;
  navigationTimeout: number;
}

export interface IInstagramConfig {
  defaultSaveDir: string;
  postsLogFile: string;
  defaultDelay: number;
  maxPostsPerBatch: number;
  batchBreakDelay: number;
  minDelay: number;
}

export interface IServerConfig {
  name: string;
  version: string;
  chromeUserDataDir: string;
  browser: IBrowserConfig;
  instagram: IInstagramConfig;
  capabilities: {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
  };
}

export interface ITransport {
  connect(): Promise<void>;
  close(): Promise<void>;
}

export interface IRequestHandler<T = unknown, R = unknown> {
  (request: T): Promise<R>;
}

export interface ICallToolRequest {
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

export interface ICallToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface IListToolsResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  }>;
}

export interface IServer {
  connect(transport: ITransport): Promise<void>;
  close(): Promise<void>;
  setRequestHandler<T, R>(schema: symbol | string, handler: IRequestHandler<T, R>, method?: string): void;
  onerror?: (error: Error) => void;
}

export const ErrorCode = {
  InvalidRequest: 'INVALID_REQUEST',
  InvalidParams: 'INVALID_PARAMS',
  MethodNotFound: 'METHOD_NOT_FOUND',
  InternalError: 'INTERNAL_ERROR',
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

export class McpError extends Error {
  constructor(public code: ErrorCodeType, message: string) {
    super(message);
    this.name = 'McpError';
  }
}

// Request schemas with method names
export const ListToolsRequestSchema = Symbol('list_tools');
export const CallToolRequestSchema = Symbol('call_tool');

// JSON-RPC method names
export const RPC_METHODS = {
  LIST_TOOLS: 'list_tools',
  CALL_TOOL: 'call_tool',
} as const;

export type RpcMethodType = typeof RPC_METHODS[keyof typeof RPC_METHODS];
