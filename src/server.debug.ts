/**
 * Debug Version of Instagram MCP Server
 * This version is designed for development and debugging:
 * - Maintains LLM interaction for detailed feedback
 * - Provides verbose logging and progress updates
 * - Useful for testing and troubleshooting
 * 
 * To use this version:
 * 1. Rename this file to server.ts
 * 2. Update index.ts to import from './server.js'
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { InstagramService } from './features/instagram/instagram.service.js';
import { IProgressUpdate, ProgressCallback } from './features/instagram/types.js';

export class InstagramMCPServer {
  private server: Server;
  private instagramService: InstagramService;

  constructor() {
    this.server = new Server(
      {
        name: 'instagram-server-debug',
        version: '0.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.instagramService = new InstagramService();
    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Debug Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_instagram_posts',
          description: 'Get recent posts from an Instagram profile using existing Chrome login',
          inputSchema: {
            type: 'object',
            properties: {
              username: {
                type: 'string',
                description: 'Instagram username to fetch posts from'
              },
              limit: {
                type: ['number', 'string'],
                description: 'Number of posts to fetch (1-3) or "all" for continuous batches'
              },
              startFrom: {
                type: 'number',
                description: 'Index to start fetching from (for pagination)'
              }
            },
            required: ['username']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'get_instagram_posts') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const args = request.params.arguments;
      if (!this.isValidFetchArgs(args)) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Invalid fetch arguments'
        );
      }

      try {
        console.error('[Debug] Fetching posts for', args.username);
        const posts = await this.instagramService.fetchPosts(
          args.username,
          args.limit,
          args.startFrom,
          ((message: string | IProgressUpdate) => {
            if (typeof message === 'string') {
              console.error('[Debug Progress]', message);
              this.server.notification({
                method: 'progress',
                params: {
                  message,
                  progress: 0,
                  total: 0
                }
              });
            } else {
              console.error('[Debug Progress]', message);
              this.server.notification({
                method: 'progress',
                params: {
                  message: message.message,
                  progress: message.progress,
                  total: message.total,
                  keepAlive: message.keepAlive
                }
              });
            }
          }) as ProgressCallback
        );
        console.error('[Debug] Fetched', posts.length, 'posts');

        return {
          content: [
            {
              type: 'json',
              json: {
                posts,
                pagination: {
                  currentBatch: {
                    start: args.startFrom || 0,
                    end: (args.startFrom || 0) + posts.length,
                    size: posts.length
                  },
                  nextStartFrom: (args.startFrom || 0) + posts.length,
                  hasMore: posts.length === 3 // Using BATCH_SIZE
                }
              }
            }
          ]
        };
      } catch (error) {
        console.error('[Debug Error]', error);
        return {
          content: [
            {
              type: 'text',
              text: `Instagram error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private isValidFetchArgs(args: any): args is {
    username: string;
    limit?: number | 'all';
    startFrom?: number;
  } {
    if (typeof args !== 'object' || args === null) return false;
    if (typeof args.username !== 'string') return false;
    if (args.limit !== undefined && 
        typeof args.limit !== 'number' && 
        args.limit !== 'all') return false;
    if (args.startFrom !== undefined && 
        typeof args.startFrom !== 'number') return false;
    return true;
  }

  private async cleanup() {
    await this.instagramService.close();
    await this.server.close();
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Instagram MCP Debug Server running on stdio');
  }
}

const server = new InstagramMCPServer();
server.run().catch(error => console.error('[Debug Fatal Error]', error));
