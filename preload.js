
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // We can expose functions to the renderer process here.
  // For example: 
  // doSomething: () => ipcRenderer.invoke('do-something')
});
