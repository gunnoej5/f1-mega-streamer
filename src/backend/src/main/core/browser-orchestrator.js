const fs = require('fs');
const { randomUUID } = require('crypto');
const puppeteer = require('puppeteer-core');
const chromeFinder = require('chrome-finder');
const { buildInjectedSyncClient } = require('../../client/injected-sync-client');

const managedInstances = new Map();

const BRAVE_PATH_CANDIDATES = [
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/usr/bin/brave-browser',
  '/usr/bin/brave',
  'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
];

function findBrowserExecutable() {
  if (process.env.BROWSER_EXECUTABLE && fs.existsSync(process.env.BROWSER_EXECUTABLE)) {
    return process.env.BROWSER_EXECUTABLE;
  }

  try {
    return chromeFinder();
  } catch (error) {
    const bravePath = BRAVE_PATH_CANDIDATES.find((candidate) => fs.existsSync(candidate));
    if (bravePath) {
      return bravePath;
    }

    throw error;
  }
}

async function injectSyncClient(page, websocketUrl) {
  const injectedScript = buildInjectedSyncClient({ websocketUrl });

  await page.evaluateOnNewDocument((scriptSource) => {
    (0, eval)(scriptSource);
  }, injectedScript);
  await page.evaluate((scriptSource) => {
    // Use indirect eval so the injected code runs in the page scope.
    (0, eval)(scriptSource);
  }, injectedScript);
}

/**
 * Launches a new browser instance, navigates to a URL, and attaches for automation.
 * @param {object} options
 * @param {string} options.url The URL to navigate to.
 * @param {string} options.websocketUrl The sync server URL for the injected client.
 * @returns {Promise<{browser: *, page: *, instanceId: string}>} The browser and page objects.
 */
async function launchStream({ url, websocketUrl, x = 50, y = 50, width = 1280, height = 720 }) {
  try {
    if (!websocketUrl) {
      throw new Error('launchStream requires a websocketUrl.');
    }

    const browserPath = findBrowserExecutable();
    const browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: false,
      pipe: true,
      defaultViewport: null,
      args: [
        `--window-position=${x},${y}`,
        `--window-size=${width},${height}`,
      ],
    });

    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await injectSyncClient(page, websocketUrl);

    const instanceId = randomUUID();
    managedInstances.set(instanceId, { browser, page });

    console.log(`Successfully launched and attached to stream: ${instanceId}`);

    page.on('close', () => {
      console.log(`Page closed for stream: ${instanceId}`);
      managedInstances.delete(instanceId);
    });

    browser.on('disconnected', () => {
      managedInstances.delete(instanceId);
    });

    return { browser, page, instanceId };
  } catch (error) {
    console.error('Error launching browser stream:', error);
    throw error;
  }
}

module.exports = {
  closeAll: async () => {
    await Promise.all(Array.from(managedInstances.values()).map(async ({ browser }) => {
      try {
        await browser.close();
      } catch (error) {
        console.warn('Failed to close managed browser:', error.message);
      }
    }));
    managedInstances.clear();
  },
  getManagedInstances: () => managedInstances,
  launchStream,
};
