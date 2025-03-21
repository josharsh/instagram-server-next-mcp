import { IInstagramPost } from '../../core/types/instagram.js';

export interface IProgressUpdate {
  type: 'progress';
  message: string;
  progress: number;
  total?: number;
  keepAlive?: boolean;
}

export type ProgressCallback = (message: string | IProgressUpdate) => void;

export interface IInstagramService {
  fetchPosts(
    username: string,
    limit?: number | 'all',
    startFrom?: number,
    onProgress?: ProgressCallback
  ): Promise<IInstagramPost[]>;
  
  fetchProfileData(
    username: string,
    dataTypes: ('posts' | 'stories' | 'highlights' | 'reels' | 'tagged')[],
    limit?: number,
    includeMetadata?: boolean,
    includeEngagement?: boolean
  ): Promise<any>;

  fetchPostData(
    url: string,
    includeComments?: boolean,
    includeLikers?: boolean,
    includeMetadata?: boolean
  ): Promise<any>;

  close(): Promise<void>;
}

export interface IToolResponse {
  content: {
    type: 'text' | 'progress';
    text?: string;
    progress?: IProgressUpdate;
  }[];
  isError?: boolean;
  keepAlive?: boolean;
}

export interface IToolHandler {
  (params: any, onProgress?: ProgressCallback): Promise<IToolResponse>;
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

export interface ISEOGenerator {
  generateDescription(post: Partial<IInstagramPost>): string;
  extractHashtags(text: string): string[];
}

export interface IMediaDownloader {
  downloadMedia(url: string, savePath: string): Promise<void>;
  downloadPoster(url: string, savePath: string): Promise<void>;
}

export interface IPostProcessor {
  processPost(
    postData: IPostData,
    saveDir: string,
    username: string
  ): Promise<IInstagramPost>;
}

export interface IPostSaver {
  savePost(post: IInstagramPost, saveDir: string): Promise<void>;
  loadFetchedPosts(): Promise<Map<string, string>>;
  saveFetchedPosts(posts: Map<string, string>): Promise<void>;
}
