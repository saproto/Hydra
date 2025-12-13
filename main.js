const { app, BrowserWindow, screen, session } = require('electron');
const fs = require('fs');
const path = require('path');
const {ElectronBlocker} = require('@ghostery/adblocker-electron');
const {autoUpdater}= require('electron-updater');
const {fetch}= require('cross-fetch');

//Change which screens the application shows based on the 'name'-window-definitions file
const productName = app.getName()

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
      preload: path.join(path.dirname('.'), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  });

  win.loadURL(url);

  // Force full screen after ready
  win.once('ready-to-show', () => {
    win.setBounds({ x, y, width, height });
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
  const windowDefsPath = path.join(path.dirname('.'), `${productName}-window-definitions.json`);
  let windowDefs = [];
  try {
    windowDefs = JSON.parse(fs.readFileSync(windowDefsPath, 'utf8'));
  } catch (err) {
    console.error(`Failed to load ${productName}-window-definitions.json:`, err);
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindowForURL('https://proto.utwente.nl/smartxp', 0);
    }
  });
});

app.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
