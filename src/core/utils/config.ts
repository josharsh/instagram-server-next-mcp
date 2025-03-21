import path from 'path';
import { type ServerCapabilities } from '@modelcontextprotocol/sdk/types';
import { ErrorCode, McpError, type IServerConfig } from '../types/mcp.js';

interface IEnvironmentVariables {
  CHROME_USER_DATA_DIR: string;
  [key: string]: string | undefined;
}

/**
 * Configuration manager for the Instagram MCP server
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: IServerConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Get singleton instance of ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get current configuration
   */
  public getConfig(): IServerConfig {
    return this.config;
  }

  /**
   * Load configuration from environment variables and defaults
   */
  private loadConfig(): IServerConfig {
    const env = this.validateEnvironment();
    const defaultSaveDir = path.join('C:/pink_ink', 'instagram_data');

    return {
      name: 'instagram-server',
      version: '0.2.0',
      chromeUserDataDir: env.CHROME_USER_DATA_DIR,
      browser: {
        headless: true,
        windowWidth: 1280,
        windowHeight: 800,
        defaultTimeout: 10000,
        navigationTimeout: 30000,
      },
      instagram: {
        defaultSaveDir,
        postsLogFile: path.join(defaultSaveDir, 'fetched_posts.json'),
        defaultDelay: 5000,  // Increased to 5 seconds between posts
        maxPostsPerBatch: 25, // Reduced batch size
        batchBreakDelay: 60000, // Increased to 1 minute break between batches
        minDelay: 3000,  // Increased minimum delay
      },
      capabilities: {
        tools: {
          get_instagram_posts: {
            defaultSaveDir,
            postsLogFile: path.join(defaultSaveDir, 'fetched_posts.json'),
            defaultDelay: 5000,  // Increased to 5 seconds between posts
            maxPostsPerBatch: 25, // Reduced batch size
            batchBreakDelay: 60000, // Increased to 1 minute break between batches
            minDelay: 3000,  // Increased minimum delay
            chromeUserDataDir: env.CHROME_USER_DATA_DIR,
          },
        },
      },
    };
  }

  /**
   * Validate required environment variables
   */
  private validateEnvironment(): IEnvironmentVariables {
    const requiredVars = ['CHROME_USER_DATA_DIR'];
    const env: IEnvironmentVariables = { ...process.env } as IEnvironmentVariables;

    for (const varName of requiredVars) {
      if (!env[varName]) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Missing required environment variable: ${varName}`
        );
      }
    }

    return env;
  }

  /**
   * Update specific configuration values
   */
  public updateConfig(partialConfig: Partial<IServerConfig>): void {
    this.config = {
      ...this.config,
      ...partialConfig,
      browser: {
        ...this.config.browser,
        ...partialConfig.browser,
      },
      instagram: {
        ...this.config.instagram,
        ...partialConfig.instagram,
      },
      capabilities: {
        ...this.config.capabilities,
        ...partialConfig.capabilities,
      },
    };
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    this.config = this.loadConfig();
  }

  /**
   * Get tool configuration
   */
  public getToolConfig<T>(toolName: string): T {
    const toolConfig = this.config.capabilities?.tools?.[toolName];
    if (!toolConfig) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Tool configuration not found: ${toolName}`
      );
    }
    return toolConfig as T;
  }
}
