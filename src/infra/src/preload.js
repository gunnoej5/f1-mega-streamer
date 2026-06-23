const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, callback) => {
    // Deliberately strip event as it includes `sender`
    const newCallback = (_, ...args) => callback(...args);
    ipcRenderer.on(channel, newCallback);
    // Return a function to remove the listener
    return () => ipcRenderer.removeListener(channel, newCallback);
  },
  send: (channel, data) => ipcRenderer.invoke(channel, data),
});
