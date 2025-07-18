
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  readFileSync: (path) => ipcRenderer.sendSync('readFileSync', path),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  initializeModelCache: (modelPath) => ipcRenderer.invoke('initialize-model-cache', modelPath),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  parseAndExtractText: (filePath) => ipcRenderer.invoke('parse-and-extract-text', filePath),
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
});

