
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

ipcMain.on('readFileSync', (event, path) => {
  event.returnValue = fs.readFileSync(path, 'utf-8');
});

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    }
  });

  const appUrl = new URL(
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../electron-app/out/index.html')}`
  );

  mainWindow.loadURL(appUrl.href);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
