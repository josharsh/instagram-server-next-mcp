#!/usr/bin/env node
/**
 * Debug Version of Instagram MCP Server Entry Point
 * This version is designed for development and debugging:
 * - Enables verbose logging
 * - Maintains LLM interaction for detailed feedback
 * - Useful for testing and troubleshooting
 * 
 * To use this version:
 * 1. Rename this file to index.ts
 * 2. Ensure server.debug.ts is renamed to server.ts
 * 3. Run `npm run build` to compile
 * 
 * Debug Features:
 * - Detailed progress updates in console
 * - LLM interaction for debugging
 * - Verbose error reporting
 * - Step-by-step operation logging
 */

// Enable debug logging
if (process.env) {
  process.env.DEBUG = 'instagram:*';
  process.env.DEBUG_DEPTH = '4';
  process.env.DEBUG_COLORS = 'true';
}

export { InstagramMCPServer } from './server.js';

// Log startup
console.error('[Debug] Instagram MCP Server Debug Version');
console.error('[Debug] Verbose logging enabled');
