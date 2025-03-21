import { Page } from 'puppeteer';

import * as path from 'path';

export interface IBrowserConfig {
  headless: boolean;
  userDataDir: string;
  profileDir: string;
  windowWidth: number;
  windowHeight: number;
  defaultTimeout: number;
  humanLikeBehavior: IHumanLikeBehaviorConfig;
  chromeFlags: string[];
  debugPort: number;
}

export interface IHumanLikeBehaviorConfig {
  minDelay: number; // Minimum delay between actions in ms
  maxDelay: number; // Maximum delay between actions in ms
  mouseMovementVariance: number; // Variance in mouse movement patterns
  scrollSpeedVariance: number; // Variance in scroll speed
  randomActionProbability: number; // Probability of random actions
}

export interface INavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  timeout?: number;
  humanLike?: boolean; // Enable human-like behavior for this navigation
}

export interface IBrowserService {
  initialize(): Promise<void>;
  getPage(): Promise<Page>;
  close(): Promise<void>;
  navigateTo(page: Page, url: string, options?: INavigationOptions): Promise<void>;
  waitForSelector(page: Page, selector: string, timeout?: number): Promise<boolean>;
  humanScroll(page: Page, distance: number): Promise<void>;
  humanClick(page: Page, selector: string): Promise<void>;
  randomDelay(): Promise<void>;
}
