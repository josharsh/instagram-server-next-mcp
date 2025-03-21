/**
 * Core MCP module exports
 */

export * from './server.js';
// Re-export ErrorCode from mcp.js with a different name
export { 
  ErrorCode as McpErrorCode,
  // Include all other exports from mcp.js
  IServerConfig, ITransport, IRequestHandler, IServer, 
  McpError, ErrorCodeType, RpcMethodType 
} from '../types/mcp.js';
export * from '../utils/errors.js';
export * from '../utils/config.js';