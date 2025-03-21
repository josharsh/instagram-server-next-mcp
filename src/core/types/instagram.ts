/**
 * Core types for Instagram data structures
 */

export interface IInstagramPost {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  localMediaPath: string;
  alt: string;
  caption: string;
  seoDescription: string;
  timestamp: string;
  postUrl: string;
  hashtags: string[];
  videoUrl?: string;
  posterUrl?: string;
}

export interface IFetchOptions {
  username: string;
  limit: number | 'all';
  saveDir: string;
  delayBetweenPosts: number;
}

export interface IFetchedPostsLog {
  lastFetch: string;
  posts: {
    [postId: string]: {
      fetchDate: string;
      postUrl: string;
    }
  }
}

export interface IPostData {
  type: 'image' | 'video';
  mediaUrl: string;
  alt: string;
  caption: string;
  timestamp: string;
  postUrl: string;
  videoUrl?: string;
  posterUrl?: string;
}

export interface IInstagramProfile {
  username: string;
  fullName: string;
  bio: string;
  profilePicUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  isVerified: boolean;
  websiteUrl?: string;
  lastScraped: string;
}

export interface IProfileScrapeResult {
  profile: IInstagramProfile;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface IProfileScrapeOptions {
  saveDir: string;
  savePhotos: boolean;
  saveMetadata: boolean;
  maxRetries: number;
  retryDelay: number;
  behavior: {
    minDelay: number;
    maxDelay: number;
    scrollVariation: number;
    mouseMovementVariation: number;
  };
  rateLimit?: {
    maxRequests: number;
    perSeconds: number;
    remaining: number;
    resetTime: number;
  };
}

export interface IGetInstagramPostsArgs {
  username: string;
  limit?: number | 'all';
  saveDir?: string;
  delayBetweenPosts?: number;
}
