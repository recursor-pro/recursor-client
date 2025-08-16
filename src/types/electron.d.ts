// Type declarations for Electron API exposed via preload script

interface ElectronAPI {
  // Cursor reset APIs
  resetCursor: (options: any) => Promise<any>;
  getCursorPaths: () => Promise<any>;
  killCursorProcesses: () => Promise<any>;
  resetMachineIds: (
    forceKill?: boolean,
    customDeviceId?: string
  ) => Promise<any>;
  cleanDatabase: (paths: any) => Promise<any>;
  restoreMainJs: (paths: any) => Promise<any>;

  // Device info APIs
  getMachineIds: () => Promise<any>;
  checkHookStatus: () => Promise<any>;
  checkCursorRunning: () => Promise<any>;
  getCursorToken: () => Promise<any>;

  // API proxy
  apiRequest: (options: any) => Promise<any>;

  // Account switching
  switchCursorAccount: (options: {
    email: string;
    token: string;
    forceKill?: boolean;
  }) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
