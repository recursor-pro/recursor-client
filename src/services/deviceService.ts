// Device information service

export interface MachineInfo {
  machineId: string;
  currentAccount: string;
  cursorToken: string;
}

export interface DeviceInfoState {
  machineId: string;
  currentAccount: string;
  cursorToken: string;
  hookStatus: boolean | null;
  cursorRunning: boolean;
}

class DeviceService {
  // Get machine IDs and basic device info
  async getMachineIds(): Promise<MachineInfo> {
    if (!window.electronAPI) {
      throw new Error("Electron API is not available");
    }

    try {
      const result = await window.electronAPI.getMachineIds();
      return {
        machineId: result.machineId,
        currentAccount: result.currentAccount,
        cursorToken: result.cursorToken,
      };
    } catch (error) {
      console.error("Failed to get machine IDs:", error);
      throw new Error("Failed to get machine IDs");
    }
  }

  // Check hook status
  async checkHookStatus(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API is not available");
    }

    try {
      return await window.electronAPI.checkHookStatus();
    } catch (error) {
      console.error("Failed to check hook status:", error);
      return false;
    }
  }

  // Check if Cursor is running
  async checkCursorRunning(): Promise<boolean> {
    if (!window.electronAPI) {
      throw new Error("Electron API is not available");
    }

    try {
      return await window.electronAPI.checkCursorRunning();
    } catch (error) {
      console.error("Failed to check Cursor running status:", error);
      return false;
    }
  }

  // Get cursor token
  async getCursorToken(): Promise<string> {
    if (!window.electronAPI) {
      throw new Error("Electron API is not available");
    }

    try {
      return await window.electronAPI.getCursorToken();
    } catch (error) {
      console.error("Failed to get cursor token:", error);
      return "";
    }
  }



  // Get complete device info
  async getDeviceInfo(): Promise<DeviceInfoState> {
    try {
      const [machineInfo, hookStatus, cursorRunning] = await Promise.all([
        this.getMachineIds(),
        this.checkHookStatus(),
        this.checkCursorRunning(),
      ]);

      return {
        machineId: machineInfo.machineId,
        currentAccount: machineInfo.currentAccount,
        cursorToken: machineInfo.cursorToken,
        hookStatus,
        cursorRunning,
      };
    } catch (error) {
      console.error("Failed to get device info:", error);
      // Return default values on error
      return {
        machineId: "",
        currentAccount: "",
        cursorToken: "",
        hookStatus: null,
        cursorRunning: false,
      };
    }
  }

  // Refresh device info
  async refreshDeviceInfo(): Promise<DeviceInfoState> {
    return this.getDeviceInfo();
  }
}

// Export singleton instance
export const deviceService = new DeviceService();
export default deviceService;
