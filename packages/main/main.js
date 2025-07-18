
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

ipcMain.on('readFileSync', (event, path) => {
  event.returnValue = fs.readFileSync(path, 'utf-8');
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('initialize-model-cache', (event, modelPath) => {
  if (!fs.existsSync(modelPath)) {
    fs.mkdirSync(modelPath, { recursive: true });
  }
  process.env.TRANSFORMERS_CACHE = modelPath;
  console.log(`Xenova cache directory set to: ${process.env.TRANSFORMERS_CACHE} from main process`);
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name)
    }));
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }
});

ipcMain.handle('read-file-content', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
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
    // mainWindow.webContents.openDevTools(); // Commented out to prevent auto-opening dev tools
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

const { env } = require('@xenova/transformers');
const os = require('os');

// Use a known cache directory
env.cacheDir = path.join(os.homedir(), '.cache', 'xenova-dev'); // or any path you prefer

// Make sure remote models are allowed (defaults to true)
env.allowRemoteModels = true;

