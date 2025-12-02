const { app, BrowserWindow, screen, session } = require('electron');
const path = require('path');
const fs = require('fs');
const fetch = require('cross-fetch');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');

const WINDOW_DEFINITIONS_PATH = path.join(__dirname, 'window-definitions.json');
let windowDefinitions = [];
let windows = [];
let blocker;

/**
 * Reads and parses the window definitions JSON file synchronously.
 * Exits the app if the file cannot be read or parsed.
 */
function loadWindowDefinitions() {
  try {
    const data = fs.readFileSync(WINDOW_DEFINITIONS_PATH, 'utf8');
    windowDefinitions = JSON.parse(data);
    console.log(`Successfully loaded ${windowDefinitions.length} window definitions.`);
  } catch (error) {
    console.error(`ERROR: Could not load or parse configuration file: ${WINDOW_DEFINITIONS_PATH}`);
    console.error(error);
    app.quit();
  }
}

/**
 * Initializes the Ghostery Ad-Blocker and enables it for the default session.
 * Uses the pre-built lists for ads and tracking.
 */
async function initializeAdBlocker() {
  console.log('Initializing AdBlocker...');
  try {
    // Use fromPrebuiltAdsAndTracking for a fast, comprehensive block list setup.
    blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
      // Optional: Configure caching to speed up future launches
      path: path.join(app.getPath('userData'), 'adblock-engine.bin'),
      read: fs.promises.readFile,
      write: fs.promises.writeFile,
    });

    // Enable blocking for the default session used by all new windows
    blocker.enableBlockingInSession(session.defaultSession);
    console.log('AdBlocker successfully initialized and enabled for all windows.');
  } catch (error) {
    console.error('ERROR: Failed to initialize AdBlocker:', error);
    // Continue application execution even if ad-blocker fails
  }
}

/**
 * Creates and positions a window based on the configuration and available displays.
 * @param {object} definition - The window configuration object.
 * @param {Display[]} allDisplays - Array of all connected Electron Display objects.
 */
function createWindow(definition, allDisplays) {
  const targetDisplay = allDisplays[definition.display];

  if (!targetDisplay) {
    console.error(`Skipping window for URL: ${definition.url}. Display index ${definition.display} not found.`);
    return;
  }

  const { x, y, width, height } = targetDisplay.bounds;

  const win = new BrowserWindow({
    // Set the window position and size to match the display bounds
    x: x,
    y: y,
    width: width,
    height: height,
    fullscreen: definition.kiosk || true, // Use fullscreen/kiosk mode
    kiosk: definition.kiosk || true,
    frame: false, // Remove window frame for a clean look
    resizable: false,
    show: false, // Don't show until ready to prevent flashing
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      // Securely load the preload script for all windows
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL(definition.url);

  // CRITICAL: Mute audio from the main process if required by the definition
  // This is more secure than trying to handle it in the renderer/preload.
  if (definition.muted) {
    win.webContents.setAudioMuted(true);
    console.log(`Window for ${definition.url} is muted.`);
  }

  win.webContents.on('did-finish-load', () => {
    // Now that content is loaded, show the window
    win.show();
  });

  win.on('closed', () => {
    // Remove reference to the window
    windows = windows.filter(w => w !== win);
  });

  windows.push(win);
  console.log(`Window created for URL: ${definition.url} on Display ${definition.display}.`);
}

/**
 * Main application setup function.
 */
async function setupApp() {
  loadWindowDefinitions();
  await initializeAdBlocker();

  // Get all available displays from the system
  const allDisplays = screen.getAllDisplays();
  console.log(`Found ${allDisplays.length} connected display(s).`);

  if (windowDefinitions.length > allDisplays.length) {
    console.warn('WARNING: More window definitions than available displays. Some windows will be skipped.');
  }

  // Create a window for each definition
  windowDefinitions.forEach(definition => {
    createWindow(definition, allDisplays);
  });
}

// --- Electron App Lifecycle ---

app.on('ready', setupApp);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create a window when the dock icon is clicked and no windows are open.
app.on('activate', () => {
  if (windows.length === 0) {
    setupApp();
  }
});