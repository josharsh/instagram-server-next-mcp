import { Server, StdioServerTransport, ErrorCode, McpError, McpRequest } from '../../core/mcp/server';
import { z } from 'zod';
import { InstagramService } from './instagram.service';
import { ConfigManager } from '../../core/utils/config';

interface InstagramProfileArgs {
  username: string;
  dataTypes: ('posts' | 'stories' | 'highlights' | 'reels' | 'tagged')[];
  limit?: number;
  includeMetadata?: boolean;
  includeEngagement?: boolean;
}

interface InstagramPostArgs {
  url: string;
  includeComments?: boolean;
  includeLikers?: boolean;
  includeMetadata?: boolean;
}

export class InstagramMcpServer {
  private server: Server;
  private instagramService: InstagramService;

  constructor() {
    this.server = new Server(
      {
        name: 'instagram-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.instagramService = new InstagramService();
    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    const ListToolsRequestSchema = z.object({
      tools: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          inputSchema: z.object({
            type: z.string(),
            properties: z.record(z.any()),
            required: z.array(z.string()).optional()
          })
        })
      )
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_profile_data',
          description: 'Get comprehensive data from an Instagram profile',
          inputSchema: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              dataTypes: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['posts', 'stories', 'highlights', 'reels', 'tagged']
                }
              },
              limit: { type: 'number', minimum: 1, maximum: 1000 },
              includeMetadata: { type: 'boolean' },
              includeEngagement: { type: 'boolean' }
            },
            required: ['username', 'dataTypes']
          }
        },
        {
          name: 'get_post_data',
          description: 'Get detailed data from an Instagram post',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', format: 'uri' },
              includeComments: { type: 'boolean' },
              includeLikers: { type: 'boolean' },
              includeMetadata: { type: 'boolean' }
            },
            required: ['url']
          }
        }
      ],
    }));

    const CallToolRequestSchema = z.object({
      name: z.string(),
      arguments: z.record(z.any())
    });

    const ProfileArgsSchema = z.object({
      username: z.string(),
      dataTypes: z.array(z.enum(['posts', 'stories', 'highlights', 'reels', 'tagged'])),
      limit: z.number().min(1).max(1000).optional(),
      includeMetadata: z.boolean().optional(),
      includeEngagement: z.boolean().optional()
    });

    const PostArgsSchema = z.object({
      url: z.string().url(),
      includeComments: z.boolean().optional(),
      includeLikers: z.boolean().optional(),
      includeMetadata: z.boolean().optional()
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: McpRequest<{
      name: string;
      arguments: Record<string, any>;
    }>) => {
      try {
        switch (request.params.name) {
          case 'get_profile_data':
            const profileArgs = ProfileArgsSchema.parse(request.params.arguments);
            return this.handleProfileData(profileArgs);
          case 'get_post_data':
            const postArgs = PostArgsSchema.parse(request.params.arguments);
            return this.handlePostData(postArgs);
          default:
            throw new McpError(ErrorCode.MethodNotFound, 'Unknown tool');
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    });
  }

  private async handleProfileData(args: InstagramProfileArgs) {
    const { username, dataTypes, limit, includeMetadata, includeEngagement } = args;
    const config = ConfigManager.getInstance().getConfig();

    const results = await this.instagramService.fetchProfileData(
      username,
      dataTypes,
      limit,
      includeMetadata,
      includeEngagement
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }]
    };
  }

  private async handlePostData(args: any) {
    const { url, includeComments, includeLikers, includeMetadata } = args;
    const config = ConfigManager.getInstance().getConfig();

    const results = await this.instagramService.fetchPostData(
      url,
      includeComments,
      includeLikers,
      includeMetadata
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Instagram MCP server running on stdio');
  }
}

const server = new InstagramMcpServer();
server.run().catch(console.error);
