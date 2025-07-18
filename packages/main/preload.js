
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readFileSync: (path) => ipcRenderer.sendSync('readFileSync', path),
});
