import {contextBridge} from 'electron'
contextBridge.exposeInMainWorld('kiosk', { ping: () => 'pong' });