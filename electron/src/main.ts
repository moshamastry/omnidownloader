import { app, BrowserWindow, ipcMain, dialog, shell, Notification } from 'electron';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fork, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function checkBackendHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4000/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startBackendServer(): Promise<void> {
  const isRunning = await checkBackendHealth();
  if (isRunning) {
    console.log('✅ Backend server is already running on port 4000');
    return;
  }

  const possiblePaths = [
    path.join(__dirname, '../../backend/dist/server.js'),
    path.join(__dirname, '../backend/dist/server.js'),
    path.join(process.resourcesPath, 'backend/dist/server.js'),
    path.resolve(process.cwd(), 'backend/dist/server.js'),
  ];

  let serverPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!serverPath) {
    serverPath = path.join(__dirname, '../../backend/dist/server.js');
  }

  try {
    console.log(`🚀 Starting backend process from: ${serverPath}`);
    backendProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: '4000' },
      stdio: 'inherit',
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend server:', err);
    });

    // Wait a brief moment for server initialization
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 200));
      if (await checkBackendHealth()) {
        console.log('✅ Backend is ready!');
        break;
      }
    }
  } catch (err) {
    console.error('Error starting backend process:', err);
  }
}

async function loadAppUrl(win: BrowserWindow) {
  const distHtml = path.resolve(__dirname, '../../frontend/dist/index.html');

  if (isDev) {
    try {
      await win.loadURL('http://localhost:5173');
      return;
    } catch {
      console.log('Vite dev server not running on 5173, falling back to 4000 or dist...');
    }
  }

  try {
    await win.loadURL('http://localhost:4000');
  } catch {
    if (fs.existsSync(distHtml)) {
      win.loadFile(distHtml);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: '#0a0d16',
    title: 'OmniDownloader Pro',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  loadAppUrl(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('dialog:selectDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('shell:openFolder', async (_event, targetPath: string) => {
  if (targetPath) {
    shell.showItemInFolder(targetPath);
  }
});

ipcMain.handle('notify', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

app.whenReady().then(async () => {
  await startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

const cleanupBackend = () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
      backendProcess = null;
    } catch {}
  }
};

app.on('before-quit', cleanupBackend);

app.on('window-all-closed', () => {
  cleanupBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

