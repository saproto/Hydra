var windows;
var Screen;
var displays;

var windowDefinitions = require("./windowDefinitions");
const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

module.exports.loadWindows = function() {
    var windowDefinitionsTemp = windowDefinitions.get();
    windows = new Array(windowDefinitionsTemp.length);
    Screen = require('screen');
    displays = Screen.getAllDisplays();

    for(var i=0; i<windowDefinitionsTemp.length; i++) {
        windows[i] = new BrowserWindow({
            "x": displays[windowDefinitionsTemp[i].displayNumber].bounds.x,
            "y": displays[windowDefinitionsTemp[i].displayNumber].bounds.y,
            "width": displays[windowDefinitionsTemp[i].displayNumber].bounds.width,
            "height": displays[windowDefinitionsTemp[i].displayNumber].bounds.height,
            "frame": false,
            "fullscreen": true,
            "show": true,
            "webPreferences": {
                "allowDisplayingInsecureContent": true,
                "allowRunningInsecureContent": true,
                "webSecurity": false,
                "nodeIntegration": false
            }
        });

        windows[i].webContents.session.clearCache(function () {
            // empty callback... :(
        });

        windows[i].loadURL(windowDefinitionsTemp[i].url);
        windows[i].reload();
        // Remove // below to enable devTools
        // windows[i].webContents.openDevTools();

        /*// Emitted when the window is closed.
        windows[i].on('closed', function() {
          // Dereference the window object, usually you would store windows
          // in an array if your app supports multi windows, this is the time
          // when you should delete the corresponding element.
          windows[i] = null;
        });*/

        windows[i].webContents.on('crashed', function () {
            this.reload();
        });
    }
};

module.exports.killWindows = function() {
    for(var i=0; i<windows.length; i++) {
        windows[i].close();
        windows[i] = null;
    }
    windows = [];
};