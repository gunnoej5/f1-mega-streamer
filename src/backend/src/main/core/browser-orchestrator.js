const puppeteer = require('puppeteer-core');
const chromeFinder = require('chrome-finder');

const managedInstances = new Map();

/**
 * Launches a new browser instance, navigates to a URL, and attaches for automation.
 * @param {object} options
 * @param {string} options.url The URL to navigate to.
 * @returns {Promise<{browser: *, page: *, instanceId: string}>} The browser and page objects.
 */
async function launchStream({ url }) {
  try {
    const chromePath = chromeFinder();
    if (!chromePath) {
      throw new Error('Google Chrome could not be found.');
    }

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: false,
      // Using port 0 tells the browser to find an available port.
      args: ['--remote-debugging-port=0'],
    });

    const browserWSEndpoint = browser.wsEndpoint();
    const connectedBrowser = await puppeteer.connect({ browserWSEndpoint });

    const page = await connectedBrowser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const instanceId = page.target()._targetId;
    managedInstances.set(instanceId, { browser: connectedBrowser, page });

    console.log(`Successfully launched and attached to stream: ${instanceId}`);

    page.on('close', () => {
      console.log(`Page closed for stream: ${instanceId}`);
      managedInstances.delete(instanceId);
      // Note: This doesn't close the browser automatically. Lifecycle needs management.
    });

    return { browser: connectedBrowser, page, instanceId };
  } catch (error) {
    console.error('Error launching browser stream:', error);
    throw error;
  }
}

module.exports = {
  launchStream,
};
