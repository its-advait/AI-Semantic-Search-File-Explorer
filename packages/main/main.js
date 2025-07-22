
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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
    const fileDetails = await Promise.all(files.map(async file => {
      const fullPath = path.join(dirPath, file.name);
      let stats = null;
      try {
        stats = await fs.promises.stat(fullPath);
      } catch (statError) {
        console.warn(`Could not get stats for ${fullPath}:`, statError.message);
      }
      return {
        name: file.name,
        isDirectory: file.isDirectory(),
        path: fullPath,
        dateCreated: stats ? stats.birthtime.toISOString() : null,
        dateModified: stats ? stats.mtime.toISOString() : null,
      };
    }));
    return fileDetails;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    throw error;
  }
});

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_FILE_SIZE_MB = 25; // 25 MB limit

ipcMain.handle('parse-and-extract-text', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return { error: `File too large: ${fileSizeMB.toFixed(2)} MB (max ${MAX_FILE_SIZE_MB} MB)` };
    }

    const fileExtension = path.extname(filePath).toLowerCase();
    let content = '';

    if (fileExtension === '.pdf') {
      const dataBuffer = await fs.promises.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      content = data.text;
    } else if (fileExtension === '.docx') {
      const dataBuffer = await fs.promises.readFile(filePath);
      const result = await mammoth.extractRawText({ arrayBuffer: dataBuffer });
      content = result.value;
    } else if ([ '.txt', '.md', '.js', '.ts', '.json', '.py', '.html', '.css' ].includes(fileExtension)) {
      content = await fs.promises.readFile(filePath, 'utf-8');
    } else {
      return { error: `Unsupported file type: ${fileExtension}` };
    }

    return { text: content };
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return { error: `Failed to parse file: ${error.message}` };
  }
});

ipcMain.handle('open-file', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error(`Failed to open file ${filePath}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-directory-dialog', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openDirectory'],
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../electron-app/public/bench_good.png'),
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

