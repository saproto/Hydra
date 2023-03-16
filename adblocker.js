const { ElectronBlocker } = require("@cliqz/adblocker-electron");
const fetch = require("cross-fetch");

exports.enableAdBlocker = (window) => {
  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    blocker.enableBlockingInSession(window.webContents.session);
  });
};
