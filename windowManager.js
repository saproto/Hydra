let windows;
let displays;

const windowDefinitions = require("./window-definitions.json").sort(
  (a, b) => a.display - b.display
);
const electron = require("electron"); // Module to create native browser window.
const { enableAdBlocker } = require("./adblocker");

module.exports.loadWindows = () => {
  if (windowDefinitions) {
    windows = new Array(windowDefinitions.length);
    displays = electron.screen.getAllDisplays();

    for (let i = 0; i < displays.length; i++) {
      let windowSpec = windowDefinitions[i];
      windows[i] = new electron.BrowserWindow({
        x: displays[i].bounds.x,
        y: displays[i].bounds.y,
        width: displays[i].bounds.width,
        height: displays[i].bounds.height,
        frame: false,
        fullscreen: true,
        show: true,
        experimentalFeatures: true,
        webPreferences: {
          allowDisplayingInsecureContent: true,
          allowRunningInsecureContent: true,
          webSecurity: false,
          nodeIntegration: false,
          preload: windowSpec.script
            ? `${__dirname}/scripts/${windowSpec.script}.js`
            : null,
        },
      });

      windows[i].webContents.session.clearCache(() => {} /*empty callback*/);
      windows[i].webContents.setAudioMuted(windowSpec.muted || false);
      windows[i].loadURL(windowSpec.url);
      enableAdBlocker(windows[i]);
      windows[i].reload();
      // Uncomment for devtools
      // windows[i].webContents.openDevTools();

      /*// Emitted when the window is closed.
            windows[i].on('closed', function() {
              // Dereference the window object, usually you would store windows
              // in an array if your app supports multi windows, this is the time
              // when you should delete the corresponding element.
              windows[i] = null;
            });*/

      windows[i].webContents.on("crashed", function () {
        windows[i].reload();
      });

      windows[i].webContents.on(
        "console-message",
        (event, level, message, line, sourceId) => {
          if (message.includes("Connection error")) {
            windows[i].reload();
          }
        }
      );
    }
  }
};

module.exports.killWindows = () => {
  for (let i = 0; i < windows.length; i++) {
    windows[i].close();
    windows[i] = null;
  }
  windows = [];
};
