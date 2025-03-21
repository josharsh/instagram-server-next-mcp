import { BrowserService } from './src/services/browser/browser.service.ts';

async function testProcessKilling() {
  const browserService = new BrowserService();
  
  try {
    console.log('Testing Chrome process killing...');
    await browserService['killChromeProcesses']();
    console.log('Process killing test completed successfully');
  } catch (error) {
    console.error('Process killing test failed:', error);
  }
}

testProcessKilling();
