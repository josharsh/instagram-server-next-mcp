declare module 'taskkill' {
    export function taskkill(pids: number[], options?: {
      force?: boolean;
      tree?: boolean;
    }): Promise<void>;
  }