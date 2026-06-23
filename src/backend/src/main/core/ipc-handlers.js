const { ipcMain } = require('electron');

function buildWindowLayout({ screen, index, streamCount }) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    const cols = Math.ceil(Math.sqrt(streamCount));
    const rows = Math.ceil(streamCount / cols);
    const windowWidth = Math.floor(width / cols);
    const windowHeight = Math.floor(height / rows);
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
      x: col * windowWidth,
      y: row * windowHeight,
      width: windowWidth,
      height: windowHeight,
    };
}

function registerIpcHandlers({ orchestrator, syncServer, screen, getMainWindow, defaultStreamUrl }) {
  const sendStateUpdate = () => {
    const mainWindow = getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    mainWindow.webContents.send('playback-state-update', syncServer.getPlaybackState());
    mainWindow.webContents.send('streams-state-update', syncServer.getClientStates().map((stream) => ({
      id: stream.id,
      volume: stream.volume,
      currentTime: stream.currentTime,
      duration: stream.duration,
      isPaused: stream.isPaused,
    })));
  };

  syncServer.onStateChange(sendStateUpdate);

  ipcMain.handle('get-initial-state', async () => ({
    playbackState: syncServer.getPlaybackState(),
    streams: syncServer.getClientStates(),
  }));

  ipcMain.handle('add-stream', async (event, url = defaultStreamUrl) => {
    const streamCount = orchestrator.getManagedInstances().size + 1;
    const layout = buildWindowLayout({ screen, index: streamCount - 1, streamCount });

    const launchedStream = await orchestrator.launchStream({
      url,
      websocketUrl: syncServer.getServerInfo().websocketUrl,
      ...layout,
    });

    return { success: true, instanceId: launchedStream.instanceId };
  });

  ipcMain.handle('launch-streams', async (event, { streamCount, url }) => {
    if (!streamCount || !url) {
      console.error('launch-streams requires streamCount and url');
      return { success: false, error: 'Invalid arguments' };
    }

    try {
      const launchPromises = [];
      for (let index = 0; index < streamCount; index += 1) {
        const layout = buildWindowLayout({ screen, index, streamCount });
        launchPromises.push(orchestrator.launchStream({
          url,
          websocketUrl: syncServer.getServerInfo().websocketUrl,
          ...layout,
        }));
      }

      await Promise.all(launchPromises);
      return { success: true };
    } catch (error) {
      console.error('Failed to launch one or more streams:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('play-all', async () => {
    syncServer.broadcast({ type: 'PLAY' });
    return { success: true };
  });

  ipcMain.handle('pause-all', async () => {
    syncServer.broadcast({ type: 'PAUSE' });
    return { success: true };
  });

  ipcMain.handle('seek-all', async (event, time) => {
    if (typeof time !== 'number') {
      return { success: false, error: 'seek-all requires a numeric time' };
    }

    syncServer.broadcast({ type: 'SEEK', payload: { time } });
    return { success: true };
  });

  ipcMain.handle('set-stream-volume', async (event, { streamId, volume }) => {
    if (!streamId || typeof volume !== 'number') {
      return { success: false, error: 'set-stream-volume requires streamId and volume' };
    }

    const sent = syncServer.sendToClient(streamId, {
      type: 'SET_VOLUME',
      payload: { volume },
    });

    if (!sent) {
      return { success: false, error: `No connected stream found for ${streamId}` };
    }

    return { success: true };
  });

  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.on('did-finish-load', () => {
      sendStateUpdate();
    });
  }
}

module.exports = { registerIpcHandlers };
