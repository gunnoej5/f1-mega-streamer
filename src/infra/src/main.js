const { app, BrowserWindow, screen } = require('electron');
const orchestrator = require('../../backend/src/main/core/browser-orchestrator');
const syncServer = require('../../backend/src/main/core/sync-server');
const { registerIpcHandlers } = require('../../backend/src/main/core/ipc-handlers');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
};

app.on('ready', async () => {
  await syncServer.startServer({ port: 0, host: '127.0.0.1' });
  const window = createWindow();
  registerIpcHandlers({
    orchestrator,
    syncServer,
    screen,
    getMainWindow: () => mainWindow,
    defaultStreamUrl: 'https://f1tv.formula1.com/',
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const window = createWindow();
    window.webContents.on('did-finish-load', () => {
      window.webContents.send('playback-state-update', syncServer.getPlaybackState());
      window.webContents.send('streams-state-update', syncServer.getClientStates().map((stream) => ({
        id: stream.id,
        volume: stream.volume,
        currentTime: stream.currentTime,
        duration: stream.duration,
        isPaused: stream.isPaused,
      })));
    });
  }
});

app.on('before-quit', async () => {
  await orchestrator.closeAll();
  await syncServer.stopServer();
});
