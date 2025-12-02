const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('kiosk', { ping: () => 'pong' });