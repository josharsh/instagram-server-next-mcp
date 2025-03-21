/**
 * Configuration types for the Instagram MCP server
 */

export interface IServerConfig {
  name: string;
  version: string;
  chromeUserDataDir: string;
  instagram: IInstagramConfig;
  browser: IBrowserConfig;
}

export interface IInstagramConfig {
  defaultSaveDir: string;
  postsLogFile: string;
  defaultDelay: number;
  maxPostsPerBatch: number;
  batchBreakDelay: number;
  minDelay: number;
  profile: {
    saveDir: string;
    photoQuality: 'low' | 'medium' | 'high';
    scrapeInterval: number;
    maxRetries: number;
    retryDelay: number;
    rateLimit: {
      maxRequests: number;
      perSeconds: number;
    };
    behavior: {
      minDelay: number;
      maxDelay: number;
      scrollVariation: number;
      mouseMovementVariation: number;
    };
  };
}

export interface IBrowserConfig {
  headless: boolean;
  windowWidth: number;
  windowHeight: number;
  defaultTimeout: number;
  navigationTimeout: number;
  debugPort: number;
}

export interface IEnvironmentVariables {
  CHROME_USER_DATA_DIR: string;
  [key: string]: string | undefined;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
