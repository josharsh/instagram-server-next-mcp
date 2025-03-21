import { ErrorCode, McpError, type ErrorCodeType } from '../types/mcp.js';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Custom error types for the Instagram MCP server
 */
export class InstagramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InstagramError';
  }
}

export class BrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserError';
  }
}

export class FileSystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Convert any error to an MCP error
   */
  static toMcpError(error: unknown): McpError {
    if (error instanceof McpError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    let code: ErrorCodeType = ErrorCode.InternalError;

    if (error instanceof InstagramError) {
      code = ErrorCode.InvalidRequest;
    }

    return new McpError(code, message);
  }

  /**
   * Create an MCP error for invalid parameters
   */
  static invalidParams(message: string): McpError {
    return new McpError(ErrorCode.InvalidParams, message);
  }

  /**
   * Create an MCP error for method not found
   */
  static methodNotFound(method: string): McpError {
    return new McpError(
      ErrorCode.MethodNotFound,
      `Unknown method: ${method}`
    );
  }

  /**
   * Create an MCP error for internal errors
   */
  static internal(message: string): McpError {
    return new McpError(ErrorCode.InternalError, message);
  }
}

/**
 * Class decorator for handling async errors
 */
export function handleClassAsyncErrors<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      
      // Get all method names from the prototype
      const methodNames = Object.getOwnPropertyNames(constructor.prototype)
        .filter(name => {
          const descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, name);
          return descriptor?.value instanceof Function && name !== 'constructor';
        });

      // Wrap each method with error handling
      for (const methodName of methodNames) {
        const originalMethod = (this as any)[methodName];
        if (originalMethod instanceof Function) {
          (this as any)[methodName] = async (...args: any[]) => {
            try {
              return await originalMethod.apply(this, args);
            } catch (error) {
              throw ErrorHandler.toMcpError(error);
            }
          };
        }
      }
    }
  };
}

/**
 * Method decorator for handling async errors
 */
export function handleAsyncErrors(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      throw ErrorHandler.toMcpError(error);
    }
  };

  return descriptor;
}
