import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { setupIPCHandlers } from './ipc/index';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Prevent EPIPE crashes when SDK subprocess pipe closes
process.on('uncaughtException', (error) => {
  if (error.message?.includes('EPIPE') || error.message?.includes('write EPIPE')) {
    console.warn('[Main] EPIPE error suppressed (subprocess pipe closed)');
    return;
  }
  console.error('[Main] Uncaught exception:', error);
});

app.setName('Paid Media Suite');

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Paid Media Suite',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      webviewTag: true,
    },
    show: false,
    backgroundColor: '#f8fafc',
  });

  // Setup IPC handlers
  setupIPCHandlers(mainWindow);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the app
  if (isDev) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  app.quit();
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  // Allow webview contents to navigate freely
  if (contents.getType() === 'webview') return;

  contents.on('will-navigate', (event, url) => {
    const devOrigin = process.env.VITE_DEV_SERVER_URL
      ? new URL(process.env.VITE_DEV_SERVER_URL).origin
      : 'http://localhost:5174';
    const parsedUrl = new URL(url);
    if (parsedUrl.origin !== devOrigin && !url.startsWith('file://')) {
      event.preventDefault();
    }
  });
});
