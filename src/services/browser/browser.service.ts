import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
// import type { ProcessDescriptor } from 'ps-list';
import { IBrowserService, IBrowserConfig, INavigationOptions } from './types.js';
import { BrowserError } from '../../core/utils/errors.js';
import { ConfigManager } from '../../core/utils/config.js';
declare module 'taskkill';

export class BrowserService implements IBrowserService {
  private browser: puppeteer.Browser | null = null;
  private config: IBrowserConfig;
  private userDataDir: string;

  constructor() {
    const serverConfig = ConfigManager.getInstance().getConfig();
    this.userDataDir = serverConfig.chromeUserDataDir || 
      path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data');
    
    this.config = {
      headless: false, // Always run in headed mode for Instagram
      userDataDir: this.userDataDir,
      profileDir: path.join(this.userDataDir, 'Default'),
      windowWidth: serverConfig.browser.windowWidth,
      windowHeight: serverConfig.browser.windowHeight,
      defaultTimeout: serverConfig.browser.defaultTimeout,
      debugPort: 9222, // Default Chrome debug port
      humanLikeBehavior: {
        minDelay: 1000,
        maxDelay: 5000,
        mouseMovementVariance: 0.5,
        scrollSpeedVariance: 0.3,
        randomActionProbability: 0.2
      },
      chromeFlags: [
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-web-security',
        '--disable-extensions-except=/path/to/extension',
        '--load-extension=/path/to/extension',
        '--remote-debugging-port=9222',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--safebrowsing-disable-auto-update',
        '--password-store=basic',
        '--use-mock-keychain'
      ]
    };
  }

  private async connectToBrowser(): Promise<puppeteer.Browser> {
    try {
      // First try to connect to existing Chrome instance
      return await puppeteer.connect({
        browserURL: `http://127.0.0.1:${this.config.debugPort}`,
        defaultViewport: null
      });
    } catch (connectError) {
      // If connection fails, check if Chrome is already running
      const isChromeRunning = await this.isChromeRunning();
      if (isChromeRunning) {
        throw new BrowserError('Chrome is running but not on debug port');
      }

      // Launch new instance if Chrome isn't running
      return await puppeteer.launch({
        headless: this.config.headless,
        channel: 'chrome',
        userDataDir: this.config.userDataDir,
        args: [
          ...this.config.chromeFlags,
          `--window-size=${this.config.windowWidth},${this.config.windowHeight}`,
          `--profile-directory=${this.config.profileDir}`,
          `--remote-debugging-port=${this.config.debugPort}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ],
        defaultViewport: {
          width: this.config.windowWidth,
          height: this.config.windowHeight
        },
        ignoreDefaultArgs: ['--disable-extensions'],
        executablePath: process.platform === 'win32' 
          ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
          : undefined
      });
    }
  }

  private async isChromeRunning(): Promise<boolean> {
    try {
      const processes = await import('ps-list');
      const chromeProcesses = (await processes.default()).filter(p => 
        p.name?.toLowerCase().includes('chrome') &&
        p.cmd?.includes('--remote-debugging-port')
      );
      return chromeProcesses.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async killChromeProcesses(): Promise<void> {
    try {
      const processes = await import('ps-list');
      const chromeProcesses = (await processes.default()).filter(p => 
        p.name?.toLowerCase().includes('chrome') &&
        p.cmd?.includes('--remote-debugging-port')
      );
      
      for (const proc of chromeProcesses) {
        try {
          if (process.platform === 'win32') {
            const { taskkill } = await import('taskkill');
            await taskkill([proc.pid], {
              force: true,
              tree: true
            });
          } else {
            process.kill(proc.pid, 'SIGKILL');
          }
        } catch (killError) {
          console.warn(`Failed to kill Chrome process ${proc.pid}:`, killError);
        }
      }
    } catch (error) {
      console.error('Error killing Chrome processes:', error);
    }
  }

  public async initialize(): Promise<void> {
    try {
      if (!this.browser) {
        // Verify Chrome user data directory exists
        if (!fs.existsSync(this.userDataDir)) {
          throw new BrowserError(`Chrome user data directory not found: ${this.userDataDir}`);
        }

        // Connect to browser with improved retry logic
        let retries = 5;
        let lastError: Error | null = null;
        
        while (retries > 0) {
          try {
            // First try to connect to existing instance
            this.browser = await this.connectToBrowser();
            
            // Verify connection
            const pages = await this.browser.pages();
            if (pages.length > 0) {
              break;
            }
            
            // If no pages, close and retry
            await this.browser.close();
            this.browser = null;
            throw new Error('No pages available');
          } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));
            retries--;
            
            // Kill any running Chrome processes if connection fails
            if (error instanceof Error && error.message.includes('not on debug port')) {
              const processes = await import('ps-list');
              const chromeProcesses = (await processes.default()).filter(p => 
                p.name?.toLowerCase().includes('chrome')
              );
              
              for (const proc of chromeProcesses) {
                try {
                  process.kill(proc.pid);
                } catch (killError) {
                  console.warn(`Failed to kill Chrome process ${proc.pid}:`, killError);
                }
              }
            }

            // Exponential backoff
            const delay = Math.pow(2, 5 - retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        if (!this.browser && lastError) {
          throw lastError;
        }

        // Handle browser events with better error recovery
        if (this.browser) {
          this.browser.on('disconnected', async () => {
            this.browser = null;
            try {
              await this.initialize(); // Attempt to reconnect
            } catch (error) {
              console.error('Failed to reconnect browser:', error);
            }
          });

          // Verify Instagram session
          const page = await this.browser.newPage();
          try {
            await this.verifyInstagramSession(page);
          } finally {
            await page.close();
          }
        }
      }
    } catch (error) {
      throw new BrowserError(
        `Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async verifyInstagramSession(page: puppeteer.Page): Promise<void> {
    try {
      await page.goto('https://www.instagram.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Check if logged in
      const isLoggedIn = await page.evaluate(() => {
        return !!document.querySelector('a[href="/accounts/logout/"]');
      });

      if (!isLoggedIn) {
        throw new BrowserError('Not logged into Instagram. Please login manually first.');
      }

      // Save cookies
      const cookies = await page.cookies();
      await fs.promises.writeFile(
        path.join(this.config.userDataDir, 'instagram_cookies.json'),
        JSON.stringify(cookies, null, 2)
      );
    } catch (error) {
      throw new BrowserError(
        `Failed to verify Instagram session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async getPage(): Promise<puppeteer.Page> {
    if (!this.browser) {
      throw new BrowserError('Browser not initialized');
    }

    try {
      const page = await this.browser.newPage();
      await this.setupPage(page);
      return page;
    } catch (error) {
      throw new BrowserError(
        `Failed to create new page: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
      } catch (error) {
        throw new BrowserError(
          `Failed to close browser: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  private async setupPage(page: puppeteer.Page): Promise<void> {
    try {
      // Set viewport and basic headers
      await page.setViewport({
        width: this.config.windowWidth,
        height: this.config.windowHeight
      });

      // Configure anti-detection measures
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
      });

      // Set user agent and headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      page.setDefaultTimeout(this.config.defaultTimeout);
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      });

      // Configure cookies and storage
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('ig_cookie_consent', 'true');
        sessionStorage.setItem('ig_session', 'active');
      });
    } catch (error) {
      throw new BrowserError(
        `Failed to setup page: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async navigateTo(
    page: puppeteer.Page,
    url: string,
    options?: INavigationOptions
  ): Promise<void> {
    try {
      // Add Instagram-specific navigation logic
      if (url.includes('instagram.com')) {
        // Check if logged in
        const isLoggedIn = await page.evaluate(() => {
          return !!document.querySelector('a[href="/accounts/logout/"]');
        });

        if (!isLoggedIn) {
          throw new BrowserError('Not logged into Instagram');
        }

        // Add random delays and human-like behavior
        await this.randomDelay();
        await this.humanScroll(page, 500);
      }

      await page.goto(url, {
        waitUntil: options?.waitUntil || 'networkidle2',
        timeout: options?.timeout || this.config.defaultTimeout
      });

      // Handle Instagram-specific elements
      if (url.includes('instagram.com')) {
        await this.handleInstagramModals(page);
      }
    } catch (error) {
      throw new BrowserError(
        `Failed to navigate to ${url}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  public async waitForSelector(
    page: puppeteer.Page,
    selector: string,
    timeout?: number
  ): Promise<boolean> {
    try {
      await this.randomDelay();
      await page.waitForSelector(selector, {
        timeout: timeout || this.config.defaultTimeout
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  public async humanScroll(page: puppeteer.Page, distance: number): Promise<void> {
    const steps = Math.ceil(distance / 100);
    const variance = this.config.humanLikeBehavior.scrollSpeedVariance;
    
    for (let i = 0; i < steps; i++) {
      const scrollAmount = 100 + (Math.random() * variance * 100 - variance * 50);
      await page.evaluate((amount) => {
        window.scrollBy(0, amount);
      }, scrollAmount);
      await this.randomDelay();
    }
  }

  public async humanClick(page: puppeteer.Page, selector: string): Promise<void> {
    try {
      const element = await page.$(selector);
      if (!element) {
        throw new BrowserError(`Element with selector ${selector} not found`);
      }

      const box = await element.boundingBox();
      if (!box) {
        throw new BrowserError(`Element with selector ${selector} is not visible`);
      }

      const variance = this.config.humanLikeBehavior.mouseMovementVariance;
      const x = box.x + box.width / 2 + (Math.random() * variance * 10 - variance * 5);
      const y = box.y + box.height / 2 + (Math.random() * variance * 10 - variance * 5);

      // Add random delays and movements
      await page.mouse.move(x, y, { steps: 10 });
      await this.randomDelay();
      await page.mouse.click(x, y);
      await this.randomDelay();
    } catch (error) {
      throw new BrowserError(
        `Failed to click element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleInstagramModals(page: puppeteer.Page): Promise<void> {
    try {
      // Handle "Turn on Notifications" modal
      const notificationModal = await page.$('div[role="dialog"]');
      if (notificationModal) {
        await this.humanClick(page, 'button[class*="HoLwm"]');
      }

      // Handle "Save Login Info" modal
      const saveLoginModal = await page.$('div[role="dialog"]');
      if (saveLoginModal) {
        await this.humanClick(page, 'button[class*="HoLwm"]');
      }
    } catch (error) {
      // Silently fail modal handling
      console.error('Error handling Instagram modals:', error);
    }
  }

  public async randomDelay(): Promise<void> {
    const { minDelay, maxDelay } = this.config.humanLikeBehavior;
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
