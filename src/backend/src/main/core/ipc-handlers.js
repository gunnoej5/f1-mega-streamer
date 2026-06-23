const { ipcMain } = require('electron');

function registerIpcHandlers({ orchestrator, syncServer, screen }) {
  ipcMain.handle('launch-streams', async (event, { streamCount, url }) => {
    if (!streamCount || !url) {
      console.error('launch-streams requires streamCount and url');
      return { success: false, error: 'Invalid arguments' };
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Simple grid calculation
    const cols = Math.ceil(Math.sqrt(streamCount));
    const rows = Math.ceil(streamCount / cols);
    const windowWidth = Math.floor(width / cols);
    const windowHeight = Math.floor(height / rows);

    const promises = [];
    for (let i = 0; i < streamCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * windowWidth;
      const y = row * windowHeight;

      console.log(`Launching stream ${i + 1} at ${x},${y} size ${windowWidth}x${windowHeight}`);

      // The orchestrator needs to be updated to handle position/size
      promises.push(orchestrator.launchStream({
        url,
        x,
        y,
        width: windowWidth,
        height: windowHeight,
      }));
    }

    try {
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Failed to launch one or more streams:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerIpcHandlers };
