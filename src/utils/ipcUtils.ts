// IPC Utility Functions for Cursor Reset Tool
// Provides easy-to-use functions for communicating with the main process

import {
  IPC_CHANNELS,
  ResetOptions,
  ResetResult,
  MachineIds,
  SwitchAccountOptions,
  ApiRequestOptions,
  ApiResponse,
  CursorPaths,
  HookOptions,
  PathValidationResult,
  CursorProcessInfo,
  DatabaseCleanupResult,
  OperationResult,
} from "../types/ipcTypes";

// Check if we're in Electron environment
const isElectron = typeof window !== "undefined" && window.electronAPI;

if (!isElectron) {
  console.warn("IPC utilities are only available in Electron environment");
}

// Main reset functionality
export async function resetCursor(
  options: ResetOptions = {}
): Promise<ResetResult> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.RESET_CURSOR, options);
}

// Individual operations
export async function getCursorPaths(): Promise<CursorPaths> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.GET_CURSOR_PATHS);
}

export async function killCursorProcesses(): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.KILL_CURSOR_PROCESSES);
}

export async function resetMachineIds(
  forceKill = false,
  customDeviceId?: string
): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(
    IPC_CHANNELS.RESET_MACHINE_IDS,
    forceKill,
    customDeviceId
  );
}

export async function cleanDatabase(paths: CursorPaths): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.CLEAN_DATABASE, paths);
}

export async function restoreMainJs(paths: CursorPaths): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.RESTORE_MAIN_JS, paths);
}

// Device info
export async function getMachineIds(): Promise<MachineIds> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.GET_MACHINE_IDS);
}

export async function checkHookStatus(): Promise<boolean> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.CHECK_HOOK_STATUS);
}

export async function checkCursorRunning(): Promise<boolean> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.CHECK_CURSOR_RUNNING);
}

export async function getCursorToken(): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.GET_CURSOR_TOKEN);
}

// Account management
export async function switchCursorAccount(
  options: SwitchAccountOptions
): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.SWITCH_CURSOR_ACCOUNT, options);
}

// Hook/Injection management
export async function hookMainJs(options: HookOptions = {}): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  const { forceKill = false } = options;
  return window.electronAPI.invoke(IPC_CHANNELS.HOOK_MAIN_JS, forceKill);
}

export async function restoreHook(options: HookOptions = {}): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  const { forceKill = false } = options;
  return window.electronAPI.invoke(IPC_CHANNELS.RESTORE_HOOK, forceKill);
}

// Advanced path management
export async function getRunningCursorPath(): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.GET_RUNNING_CURSOR_PATH);
}

export async function validateCursorPath(
  selectedPath: string
): Promise<PathValidationResult> {
  if (!isElectron) throw new Error("Not in Electron environment");
  try {
    const isValid = await window.electronAPI.invoke(
      IPC_CHANNELS.VALIDATE_CURSOR_PATH,
      selectedPath
    );
    const mainJsPath = isValid ? await findMainJsFromPath(selectedPath) : undefined;
    return {
      isValid,
      mainJsPath,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function findMainJsFromPath(
  selectedPath: string
): Promise<string> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(
    IPC_CHANNELS.FIND_MAIN_JS_FROM_PATH,
    selectedPath
  );
}

// Database cleanup
export async function cleanupDatabaseEntries(): Promise<DatabaseCleanupResult> {
  if (!isElectron) throw new Error("Not in Electron environment");
  try {
    await window.electronAPI.invoke(IPC_CHANNELS.CLEANUP_DATABASE_ENTRIES);
    return {
      success: true,
      entriesRemoved: 0, // Could be enhanced to return actual count from backend
    };
  } catch (error) {
    return {
      success: false,
      entriesRemoved: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

// API proxy
export async function apiRequest(
  options: ApiRequestOptions
): Promise<ApiResponse> {
  if (!isElectron) throw new Error("Not in Electron environment");
  return window.electronAPI.invoke(IPC_CHANNELS.API_REQUEST, options);
}

// Utility functions for common operations
export async function isHookApplied(): Promise<boolean> {
  return await checkHookStatus();
}

export async function isCursorRunning(): Promise<boolean> {
  return await checkCursorRunning();
}

export async function getCurrentMachineInfo(): Promise<MachineIds> {
  return await getMachineIds();
}

// Enhanced utility functions with proper typing
export async function getCursorProcessInfo(): Promise<CursorProcessInfo> {
  try {
    const isRunning = await checkCursorRunning();
    if (!isRunning) {
      return { isRunning: false };
    }

    try {
      const processPath = await getRunningCursorPath();
      return {
        isRunning: true,
        processPath,
      };
    } catch (error) {
      // Process is running but can't get path (e.g., on non-Windows systems)
      return { isRunning: true };
    }
  } catch (error) {
    return { isRunning: false };
  }
}

// Operation wrapper with result tracking
export async function executeOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<OperationResult<T>> {
  const timestamp = Date.now();

  try {
    const data = await operation();
    return {
      status: 'success',
      data,
      timestamp,
    };
  } catch (error) {
    return {
      status: 'error',
      error: {
        code: 'OPERATION_FAILED',
        message: error instanceof Error ? error.message : String(error),
        details: { operationName },
      },
      timestamp,
    };
  }
}

// Combined operations
export async function fullReset(
  options: ResetOptions = {}
): Promise<ResetResult> {
  return await resetCursor(options);
}

export async function safeHookApply(forceKill = true): Promise<string> {
  try {
    return await hookMainJs({ forceKill });
  } catch (error) {
    console.error("Hook application failed:", error);
    throw error;
  }
}

export async function safeHookRestore(forceKill = true): Promise<string> {
  try {
    return await restoreHook({ forceKill });
  } catch (error) {
    console.error("Hook restoration failed:", error);
    throw error;
  }
}
