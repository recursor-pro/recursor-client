// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Cursor reset APIs
  resetCursor: (options: any) => ipcRenderer.invoke('reset-cursor', options),
  getCursorPaths: () => ipcRenderer.invoke('get-cursor-paths'),
  killCursorProcesses: () => ipcRenderer.invoke('kill-cursor-processes'),
  resetMachineIds: (forceKill?: boolean, customDeviceId?: string) => ipcRenderer.invoke('reset-machine-ids', forceKill, customDeviceId),
  cleanDatabase: (paths: any) => ipcRenderer.invoke('clean-database', paths),
  restoreMainJs: (paths: any) => ipcRenderer.invoke('restore-main-js', paths),
  // Device info APIs
  getMachineIds: () => ipcRenderer.invoke('get-machine-ids'),
  checkHookStatus: () => ipcRenderer.invoke('check-hook-status'),
  checkCursorRunning: () => ipcRenderer.invoke('check-cursor-running'),
  getCursorToken: () => ipcRenderer.invoke('get-cursor-token'),
  // API proxy
  apiRequest: (options: any) => ipcRenderer.invoke('api-request', options),
  // Account switching
  switchCursorAccount: (options: { email: string; token: string; forceKill?: boolean }) =>
    ipcRenderer.invoke('switch-cursor-account', options),
});
