export class Server {
  private handlers: Map<string, Function> = new Map();

  constructor(
    public readonly config: { name: string; version: string },
    public readonly capabilities: Record<string, unknown>
  ) {}

  getRequestHandler(method: string): Function | undefined {
    return this.handlers.get(method);
  }

  setRequestHandler(schema: any, handler: Function) {
    this.handlers.set(schema.type, handler);
  }

  async connect(transport: any) {
    // Implementation to handle incoming requests
  }
}

export class StdioServerTransport {
  // Implementation for stdio communication
}

export enum ErrorCode {
  InvalidRequest = 'INVALID_REQUEST',
  MethodNotFound = 'METHOD_NOT_FOUND',
  InternalError = 'INTERNAL_ERROR',
}

export class McpError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
  }
}

export interface McpRequest<T = any> {
  params: T;
}
