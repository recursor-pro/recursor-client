// Type declarations for Electron API exposed via preload script

// Import types from ipcTypes
import type {
  CursorPaths,
  ResetOptions,
  ResetResult,
  MachineIds,
  SwitchAccountOptions,
  ApiRequestOptions,
  ApiResponse,
  ExportResult,
} from './ipcTypes';

export interface ElectronAPI {
  // Generic invoke method for all IPC calls
  invoke: (channel: string, ...args: any[]) => Promise<any>;

  // Cursor reset APIs
  resetCursor: (options: ResetOptions) => Promise<ResetResult>;
  getCursorPaths: () => Promise<CursorPaths>;
  killCursorProcesses: () => Promise<string>;
  resetMachineIds: (
    forceKill?: boolean,
    customDeviceId?: string
  ) => Promise<string>;
  cleanDatabase: (paths: CursorPaths) => Promise<string>;
  restoreMainJs: (paths: CursorPaths) => Promise<string>;

  // Device info APIs
  getMachineIds: () => Promise<MachineIds>;
  checkHookStatus: () => Promise<boolean>;
  checkCursorRunning: () => Promise<boolean>;
  getCursorToken: () => Promise<string>;

  // Account switching
  switchCursorAccount: (options: SwitchAccountOptions) => Promise<string>;

  // Hook/Injection Management APIs
  hookMainJs: (forceKill?: boolean) => Promise<string>;
  restoreHook: (forceKill?: boolean) => Promise<string>;

  // Advanced Path Management APIs
  getRunningCursorPath: () => Promise<string>;
  validateCursorPath: (selectedPath: string) => Promise<boolean>;
  findMainJsFromPath: (selectedPath: string) => Promise<string>;

  // Database cleanup APIs
  cleanupDatabaseEntries: () => Promise<string>;

  // Admin privileges APIs
  checkAdminPrivileges: () => Promise<boolean>;
  requestAdminPrivileges: () => Promise<boolean>;
  isAdminRequired: () => Promise<boolean>;

  // API proxy
  apiRequest: (options: ApiRequestOptions) => Promise<ApiResponse>;

  // Export functionality
  exportCursorData: () => Promise<ExportResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export { ElectronAPI };
