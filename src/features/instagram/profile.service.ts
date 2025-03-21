import { Page } from 'puppeteer';
import { IInstagramProfile, IProfileScrapeResult, IProfileScrapeOptions } from '../../core/types/instagram';
import { BrowserService } from '../../services/browser/browser.service';
import { ConfigError } from '../../core/utils/errors';
import { MediaDownloader } from './utils/media';
import path from 'path';
import fs from 'fs';

export class ProfileService {
  private browserService: BrowserService;
  private mediaDownloader: MediaDownloader;
  private options: IProfileScrapeOptions;
  private readonly INSTAGRAM_URL = 'https://www.instagram.com';

  constructor(
    browserService: BrowserService,
    mediaDownloader: MediaDownloader,
    options: IProfileScrapeOptions
  ) {
    this.browserService = browserService;
    this.mediaDownloader = mediaDownloader;
    this.options = options;
  }

  async scrapeProfile(username: string): Promise<IProfileScrapeResult> {
    try {
      if (!username) {
        throw new ConfigError('Username is required');
      }

      const page = await this.browserService.getPage();
      
      // Simulate human-like behavior before navigation
      await this.simulateHumanBehavior(page);
      
      // Add additional headers to appear more human-like
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      // Navigate to profile with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await page.goto(`${this.INSTAGRAM_URL}/${username}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await this.simulateHumanBehavior(page);
        }
      }

      // Simulate human-like behavior after page load
      await this.simulateHumanBehavior(page);

      // Check if profile exists and handle Instagram's anti-bot measures
      const profileExists = await this.validateProfileExists(page);
      if (!profileExists) {
        // Check if we're being rate limited
        const isRateLimited = await page.evaluate(() => {
          return document.body.innerText.includes('rate limited') || 
                 document.body.innerText.includes('too many requests');
        });

        if (isRateLimited) {
          throw new ConfigError('Instagram rate limit exceeded. Please try again later.');
        }

        throw new ConfigError(`Profile @${username} not found`);
      }

      // Scrape profile data
      // Check rate limits
      const rateLimit = this.options.rateLimit;
      if (rateLimit && rateLimit.remaining === 0) {
        const waitTime = rateLimit.resetTime - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      }

      const profile = await this.extractProfileData(page);
      
      // Update rate limit tracking
      if (rateLimit) {
        rateLimit.remaining--;
        if (rateLimit.remaining <= 0) {
          rateLimit.resetTime = Date.now() + (rateLimit.perSeconds * 1000);
          rateLimit.remaining = rateLimit.maxRequests;
        }
      }
      
      // Download profile photo if enabled
      if (this.options.savePhotos) {
        await this.downloadProfilePhoto(profile);
      }

      // Save metadata if enabled
      if (this.options.saveMetadata) {
        await this.saveProfileMetadata(profile);
      }

      return {
        profile,
        success: true,
        error: undefined,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        profile: {} as IInstagramProfile,
        success: false,
        error: error instanceof Error ? error.message : undefined,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async validateProfileExists(page: Page): Promise<boolean> {
    try {
      await page.waitForSelector('header section', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async extractProfileData(page: Page): Promise<IInstagramProfile> {
    return await page.evaluate(() => {
      try {
        const header = document.querySelector('header section');
        if (!header) throw new Error('Profile header not found');

        // Handle private profiles
        const isPrivate = !!header.querySelector('div[role="button"]');
        if (isPrivate) {
          return {
            username: header.querySelector('h2')?.textContent?.trim() || '',
            fullName: header.querySelector('h1')?.textContent?.trim() || '',
            bio: '',
            profilePicUrl: header.querySelector('img')?.src || '',
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            isPrivate: true,
            isVerified: !!header.querySelector('svg[aria-label="Verified"]'),
            lastScraped: new Date().toISOString()
          };
        }

        // Extract profile data with additional validation
        const username = header.querySelector('h2')?.textContent?.trim() || '';
        const fullName = header.querySelector('h1')?.textContent?.trim() || '';
        const bio = header.querySelector('div.-vDIg span')?.textContent?.trim() || '';
        const profilePicUrl = header.querySelector('img')?.src || '';
        
        // Handle follower/following counts with better error handling
        const followersCount = parseInt(
          header.querySelector('li:nth-child(2) span')?.textContent?.replace(/,/g, '') || '0'
        );
        const followingCount = parseInt(
          header.querySelector('li:nth-child(3) span')?.textContent?.replace(/,/g, '') || '0'
        );
        const postsCount = parseInt(
          header.querySelector('li:nth-child(1) span')?.textContent?.replace(/,/g, '') || '0'
        );

        return {
          username,
          fullName,
          bio,
          profilePicUrl,
          followersCount,
          followingCount,
          postsCount,
          isPrivate: false,
          isVerified: !!header.querySelector('svg[aria-label="Verified"]'),
          lastScraped: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error extracting profile data:', error);
        throw new Error('Failed to extract profile data');
      }
    });
  }

  private async downloadProfilePhoto(profile: IInstagramProfile): Promise<void> {
    if (!profile.profilePicUrl) {
      throw new ConfigError('Profile picture URL is missing');
    }

    const fileName = `${profile.username}_profile${MediaDownloader.getFileExtension(
      profile.profilePicUrl,
      '.jpg'
    )}`;
    const savePath = path.join(this.options.saveDir, fileName);

    await this.mediaDownloader.downloadMedia(profile.profilePicUrl, savePath);
  }

  private async saveProfileMetadata(profile: IInstagramProfile): Promise<void> {
    const fileName = `${profile.username}_metadata.json`;
    const savePath = path.join(this.options.saveDir, fileName);
    
    const metadata = {
      ...profile,
      scrapedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    try {
      await fs.promises.writeFile(savePath, JSON.stringify(metadata, null, 2));
    } catch (error) {
      throw new ConfigError(`Failed to save metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateProfileData(profile: IInstagramProfile): Promise<boolean> {
    const requiredFields = [
      'username',
      'fullName',
      'profilePicUrl'
    ];

    const optionalFields = [
      'bio',
      'followersCount',
      'followingCount',
      'postsCount'
    ];

    // Validate required fields
    const hasRequiredFields = requiredFields.every(field => {
      const value = profile[field as keyof IInstagramProfile];
      return value !== undefined && value !== null && value !== '';
    });

    // Validate optional fields
    const hasValidOptionalFields = optionalFields.every(field => {
      const value = profile[field as keyof IInstagramProfile];
      return value !== undefined && value !== null;
    });

    // Validate profile picture URL format
    const isValidProfilePic = /^https?:\/\/.+\..+/.test(profile.profilePicUrl);

    return hasRequiredFields && hasValidOptionalFields && isValidProfilePic;
  }

  private async simulateHumanBehavior(page: Page): Promise<void> {
    const { minDelay, maxDelay, scrollVariation, mouseMovementVariation } = 
      this.options.behavior;

    // Random delay between actions
    await new Promise(resolve => setTimeout(resolve,
      Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
    ));

    // Random mouse movement
    if (mouseMovementVariation > 0) {
      const x = Math.floor(Math.random() * mouseMovementVariation);
      const y = Math.floor(Math.random() * mouseMovementVariation);
      await page.mouse.move(x, y);
    }

    // Random scroll
    if (scrollVariation > 0) {
      const scrollAmount = Math.floor(Math.random() * scrollVariation);
      await page.evaluate((amount: number) => {
        window.scrollBy(0, amount);
      }, scrollAmount);
    }
  }
}
