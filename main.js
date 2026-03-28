import { app, BrowserWindow, globalShortcut, screen, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { ElectronBlocker } from '@ghostery/adblocker-electron';
import updater from "electron-updater"

const { autoUpdater } = updater
import fetch from 'cross-fetch';

app.commandLine.appendSwitch('use-angle', 'gl');
app.commandLine.appendSwitch('use-gl', 'egl');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('https://localhost:3000') || url.startsWith('wss://localhost:3000')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

function createWindowForURL(url, displayIndex) {
  const displays = screen.getAllDisplays();
  const targetDisplay = displays[displayIndex] || screen.getPrimaryDisplay();

  const { x, y, width, height } = targetDisplay.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false, // remove title bar and borders
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  });

  win.loadURL(url);

  // Force full screen after ready
  win.once('ready-to-show', () => {
    win.setBounds({ x, y, width, height });
    win.show();
    win.setFullScreen(true);
  });


  return win;
}


async function initializeAdBlocker() {
  try {
    const blocker = await ElectronBlocker.fromPrebuiltFull(fetch);
    blocker.enableBlockingInSession(session.defaultSession);

    console.log('AdBlocker successfully initialized.');
  } catch (err) {
    console.error('Failed to initialize AdBlocker:', err);
  }
}

app.whenReady().then(async () => {

  await initializeAdBlocker();

  console.log(`Found ${screen.getAllDisplays().length} connected display(s).`);

  // Load window definitions from JSON file
  const windowDefsPath = path.join(app.getAppPath(), `window-definitions.json`);
  console.error(`Loaded:`, windowDefsPath);
  let windowDefs = [];
  try {
    windowDefs = JSON.parse(fs.readFileSync(windowDefsPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to load window-definitions.json:`, err);
  }

  // Create windows based on definitions
  windowDefs.forEach(def => {
    createWindowForURL(def.url, def.display);
  });

  if (app.isPackaged) {
    // Check for updates on launch
    autoUpdater.checkForUpdates();
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 1000 * 60 * 60);
  }

  globalShortcut.register("Escape", () => {
    app.quit();
  });
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
