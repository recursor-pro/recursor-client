// IPC Types for Cursor Reset Tool
// Defines all the IPC communication interfaces between main and renderer processes

export interface CursorPaths {
  storage: string;
  auth: string;
  database: string;
  mainJs?: string;
  configDir: string;
}

export interface ResetOptions {
  forceKill?: boolean;
  customDeviceId?: string;
}

export interface ResetResult {
  success: boolean;
  message: string;
  details: {
    kill: string;
    reset: string;
    clean: string;
    restore: string;
  };
}

export interface MachineIds {
  machineId: string;
  currentAccount: string;
  cursorToken: string;
}

export interface SwitchAccountOptions {
  email: string;
  token: string;
  forceKill?: boolean;
}

export interface ApiRequestOptions {
  url: string;
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface ApiResponse {
  status?: number;
  statusText?: string;
  headers?: any;
  data?: any;
}

// Hook/Injection Management Types
export interface HookOptions {
  forceKill?: boolean;
}

export interface HookResult {
  success: boolean;
  message: string;
  backupCreated?: boolean;
  backupPath?: string;
}

// Path Management Types
export interface PathValidationResult {
  isValid: boolean;
  mainJsPath?: string;
  error?: string;
}

export interface CursorProcessInfo {
  isRunning: boolean;
  processPath?: string;
  processId?: number;
}

// Database Cleanup Types
export interface DatabaseCleanupResult {
  success: boolean;
  entriesRemoved: number;
  errors?: string[];
  message?: string;
}

// Error Types
export interface CursorResetError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// Admin Privileges Types
export interface AdminPrivilegesInfo {
  hasAdminPrivileges: boolean;
  isAdminRequired: boolean;
  platform: string;
  canRequestElevation: boolean;
}

export interface AdminPrivilegesResult {
  success: boolean;
  hasPrivileges: boolean;
  message?: string;
  error?: string;
}

// Operation Status Types
export type OperationStatus = 'idle' | 'running' | 'success' | 'error';

export interface OperationResult<T = any> {
  status: OperationStatus;
  data?: T;
  error?: CursorResetError;
  timestamp: number;
}

// Export Types
export interface ExportResult {
  success: boolean;
  message: string;
  exportPath?: string;
  filesExported?: string[];
}

// IPC Channel Names
export const IPC_CHANNELS = {
  // Main reset functionality
  RESET_CURSOR: "reset-cursor",

  // Individual operations
  GET_CURSOR_PATHS: "get-cursor-paths",
  KILL_CURSOR_PROCESSES: "kill-cursor-processes",
  RESET_MACHINE_IDS: "reset-machine-ids",
  CLEAN_DATABASE: "clean-database",
  RESTORE_MAIN_JS: "restore-main-js",

  // Device info
  GET_MACHINE_IDS: "get-machine-ids",
  CHECK_HOOK_STATUS: "check-hook-status",
  CHECK_CURSOR_RUNNING: "check-cursor-running",
  GET_CURSOR_TOKEN: "get-cursor-token",

  // Account management
  SWITCH_CURSOR_ACCOUNT: "switch-cursor-account",

  // Hook/Injection management
  HOOK_MAIN_JS: "hook-main-js",
  RESTORE_HOOK: "restore-hook",

  // Advanced path management
  GET_RUNNING_CURSOR_PATH: "get-running-cursor-path",
  VALIDATE_CURSOR_PATH: "validate-cursor-path",
  FIND_MAIN_JS_FROM_PATH: "find-main-js-from-path",

  // Database cleanup
  CLEANUP_DATABASE_ENTRIES: "cleanup-database-entries",

  // Admin privileges
  CHECK_ADMIN_PRIVILEGES: "check-admin-privileges",
  REQUEST_ADMIN_PRIVILEGES: "request-admin-privileges",
  IS_ADMIN_REQUIRED: "is-admin-required",

  // API proxy
  API_REQUEST: "api-request",

  // Export functionality
  EXPORT_CURSOR_DATA: "export-cursor-data",
} as const;

// Type for IPC channel names
export type IpcChannelName = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
