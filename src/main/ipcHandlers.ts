import { ipcMain, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import * as crypto from "crypto";
import * as https from "https";
import Database from "better-sqlite3";

const execAsync = promisify(exec);

interface CursorPaths {
  storage: string;
  auth: string;
  database: string;
  mainJs?: string;
  configDir: string;
}

// Generate new random IDs (following client-sample logic)
function generateNewIds(customDeviceId?: string) {
  // Generate random bytes for hashing
  const randomBytes32 = crypto.randomBytes(32);
  const randomBytes64 = crypto.randomBytes(64);

  // Generate device ID (UUID v4 format)
  const devDeviceId = customDeviceId || crypto.randomUUID();

  // Generate MAC machine ID (SHA-512 hash)
  const macMachineId = crypto
    .createHash("sha512")
    .update(randomBytes64)
    .digest("hex");

  // Generate machine ID (SHA-256 hash)
  const machineId = crypto
    .createHash("sha256")
    .update(randomBytes32)
    .digest("hex");

  // Generate SQM ID (UUID v4 in uppercase with braces)
  const sqmId = `{${crypto.randomUUID().toUpperCase()}}`;

  return {
    "telemetry.devDeviceId": devDeviceId,
    "telemetry.macMachineId": macMachineId,
    "telemetry.machineId": machineId,
    "telemetry.sqmId": sqmId,
  };
}

// Get Cursor paths based on OS
function getCursorPaths(): CursorPaths {
  const platform = os.platform();
  const homeDir = os.homedir();

  let configDir: string;
  let appDataDir: string;

  switch (platform) {
    case "win32":
      appDataDir = path.join(homeDir, "AppData", "Roaming", "Cursor");
      configDir = path.join(homeDir, "AppData", "Roaming", "Cursor", "User");
      break;
    case "darwin":
      appDataDir = path.join(
        homeDir,
        "Library",
        "Application Support",
        "Cursor"
      );
      configDir = path.join(
        homeDir,
        "Library",
        "Application Support",
        "Cursor",
        "User"
      );
      break;
    case "linux":
      appDataDir = path.join(homeDir, ".config", "Cursor");
      configDir = path.join(homeDir, ".config", "Cursor", "User");
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  return {
    storage: path.join(configDir, "globalStorage", "storage.json"),
    auth: path.join(configDir, "globalStorage", "cursor.auth.json"),
    database: path.join(configDir, "globalStorage", "state.vscdb"),
    configDir,
    mainJs: findMainJs(appDataDir),
  };
}

// Advanced Path Management

// Find main.js from selected path
function findMainJsFromSelectedPath(selectedPath: string): string {
  const platform = os.platform();
  let possiblePaths: string[] = [];

  if (platform === "darwin") {
    // macOS - look for main.js in app bundle
    if (selectedPath.includes("Cursor.app")) {
      possiblePaths = [
        path.join(selectedPath, "Contents/Resources/app/out/main.js"),
        path.join(selectedPath, "Contents/Resources/app/main.js"),
      ];
    } else {
      possiblePaths = [
        path.join(selectedPath, "main.js"),
        path.join(selectedPath, "out/main.js"),
        path.join(selectedPath, "app/out/main.js"),
        path.join(selectedPath, "app/main.js"),
      ];
    }
  } else if (platform === "win32") {
    // Windows - look in resources/app
    possiblePaths = [
      path.join(selectedPath, "resources/app/out/main.js"),
      path.join(selectedPath, "resources/app/main.js"),
      path.join(selectedPath, "main.js"),
      path.join(selectedPath, "out/main.js"),
    ];
  } else {
    // Linux
    possiblePaths = [
      path.join(selectedPath, "resources/app/out/main.js"),
      path.join(selectedPath, "resources/app/main.js"),
      path.join(selectedPath, "main.js"),
      path.join(selectedPath, "out/main.js"),
    ];
  }

  for (const mainJsPath of possiblePaths) {
    if (fs.existsSync(mainJsPath)) {
      return mainJsPath;
    }
  }

  throw new Error(`Could not find main.js in selected path: ${selectedPath}`);
}

// Get running Cursor process path
async function getRunningCursorPath(): Promise<string> {
  const platform = os.platform();

  if (!(await isCursorRunning())) {
    throw new Error("Cursor process is not running");
  }

  if (platform === "win32") {
    try {
      // Use PowerShell to get process path
      const { stdout } = await execAsync(
        'powershell -WindowStyle Hidden -Command "(Get-Process cursor | Where-Object {$_.Path -ne $null} | Select-Object -First 1).Path"'
      );
      const cleanPath = stdout.trim();

      if (cleanPath && cleanPath !== "") {
        console.log("Found Cursor process path:", cleanPath);
        return cleanPath;
      }

      // Fallback to wmic
      const { stdout: wmicOutput } = await execAsync(
        "wmic process where \"name='cursor.exe'\" get ExecutablePath /value"
      );

      const pathMatch = wmicOutput
        .split("\n")
        .find((line) => line.startsWith("ExecutablePath="))
        ?.replace("ExecutablePath=", "")
        .trim();

      if (pathMatch && pathMatch !== "") {
        console.log("Found Cursor path via wmic:", pathMatch);
        return pathMatch;
      }

      throw new Error("Could not get Cursor process path");
    } catch (error) {
      throw new Error(`Failed to get Cursor process path: ${error}`);
    }
  } else {
    throw new Error(
      "Getting running process path is only supported on Windows"
    );
  }
}

// Validate and find Cursor path
async function validateCursorPath(selectedPath: string): Promise<boolean> {
  try {
    console.log("Validating Cursor path:", selectedPath);

    // Try to find main.js from selected path
    const mainJsPath = findMainJsFromSelectedPath(selectedPath);

    // Verify the file exists and is actually main.js
    if (!fs.existsSync(mainJsPath) || !mainJsPath.endsWith("main.js")) {
      throw new Error("Selected path does not contain valid main.js file");
    }

    console.log(
      "Successfully validated Cursor path, main.js found at:",
      mainJsPath
    );
    return true;
  } catch (error) {
    console.error("Cursor path validation failed:", error);
    throw new Error(`Cursor path validation failed: ${error}`);
  }
}

// Find main.js file in Cursor installation (enhanced version)
function findMainJs(appDataDir: string): string | undefined {
  try {
    const platform = os.platform();
    let possiblePaths: string[] = [];

    if (platform === "darwin") {
      // macOS paths
      possiblePaths = [
        "/Applications/Cursor.app/Contents/Resources/app/out/main.js",
        "/Applications/Cursor.app/Contents/Resources/app/main.js",
        path.join(appDataDir, "main.js"),
      ];
    } else if (platform === "win32") {
      // Windows paths
      possiblePaths = [
        path.join(
          process.env.LOCALAPPDATA || "",
          "Programs",
          "Cursor",
          "resources",
          "app",
          "out",
          "main.js"
        ),
        path.join(
          process.env.LOCALAPPDATA || "",
          "Programs",
          "Cursor",
          "resources",
          "app",
          "main.js"
        ),
        path.join(appDataDir, "main.js"),
      ];
    } else {
      // Linux paths
      possiblePaths = [
        "/opt/cursor/resources/app/out/main.js",
        "/opt/cursor/resources/app/main.js",
        path.join(appDataDir, "main.js"),
      ];
    }

    for (const mainJsPath of possiblePaths) {
      if (fs.existsSync(mainJsPath)) {
        return mainJsPath;
      }
    }
  } catch (error) {
    console.warn("Could not find main.js:", error);
  }

  return undefined;
}

// Kill Cursor processes with retry logic
async function killCursorProcesses(): Promise<string> {
  const platform = os.platform();
  const maxAttempts = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(
      `Attempting to kill Cursor processes (attempt ${attempt}/${maxAttempts})...`
    );

    // Get current running processes
    const processes = await getCursorProcessIds();

    if (processes.length === 0) {
      console.log("No Cursor processes found, kill operation complete");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a bit to ensure cleanup
      return "✅ Cursor processes closed";
    }

    // Kill each process
    for (const pid of processes) {
      try {
        await killSingleProcess(pid, platform);
        await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay between kills
      } catch (error) {
        console.log(`Failed to kill process ${pid}:`, error);
        // Continue with other processes
      }
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, retryDelay));

    // Check if any processes remain
    const remainingProcesses = await getCursorProcessIds();
    if (remainingProcesses.length === 0) {
      console.log("All Cursor processes successfully terminated");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Final wait for cleanup
      return "✅ Cursor processes closed";
    }

    if (attempt === maxAttempts) {
      throw new Error(
        "Failed to terminate all Cursor processes after maximum attempts"
      );
    }
  }

  return "✅ Cursor processes closed";
}

// Get Cursor process IDs
async function getCursorProcessIds(): Promise<string[]> {
  const platform = os.platform();

  try {
    switch (platform) {
      case "win32":
        return await getWindowsCursorProcessIds();
      case "darwin":
        return await getMacOSCursorProcessIds();
      case "linux":
        return await getLinuxCursorProcessIds();
      default:
        return [];
    }
  } catch (error) {
    console.log("Error getting Cursor process IDs:", error);
    return [];
  }
}

// Windows-specific process ID retrieval
async function getWindowsCursorProcessIds(): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      'tasklist /FI "IMAGENAME eq Cursor.exe" /FO CSV /NH'
    );
    const lines = stdout
      .trim()
      .split("\n")
      .filter((line) => line.includes("Cursor.exe"));
    const pids: string[] = [];

    for (const line of lines) {
      const match = line.match(/"Cursor\.exe","(\d+)"/);
      if (match) {
        pids.push(match[1]);
      }
    }

    return pids;
  } catch {
    return [];
  }
}

// macOS-specific process ID retrieval
async function getMacOSCursorProcessIds(): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      "pgrep -f '/Applications/Cursor.app/Contents/MacOS/Cursor'"
    );
    const pids = stdout
      .trim()
      .split("\n")
      .filter((pid) => pid.trim());

    // Validate each PID to ensure it's actually a Cursor process
    const validPids: string[] = [];
    for (const pid of pids) {
      try {
        const { stdout: processInfo } = await execAsync(
          `ps -p ${pid.trim()} -o args=`
        );
        if (
          processInfo.includes(
            "/Applications/Cursor.app/Contents/MacOS/Cursor"
          ) &&
          !processInfo.includes("--type=") &&
          !processInfo.includes("Helper")
        ) {
          validPids.push(pid.trim());
        }
      } catch {
        // Continue checking other PIDs
      }
    }

    return validPids;
  } catch {
    return [];
  }
}

// Linux-specific process ID retrieval
async function getLinuxCursorProcessIds(): Promise<string[]> {
  const commands = [
    "pgrep -f '/usr/bin/cursor'",
    "pgrep -f '/opt/cursor'",
    "pgrep -f '/snap/cursor'",
    "pgrep -x cursor",
  ];

  for (const command of commands) {
    try {
      const { stdout } = await execAsync(command);
      const pids = stdout
        .trim()
        .split("\n")
        .filter((pid) => pid.trim());
      if (pids.length > 0) {
        return pids;
      }
    } catch {
      // Try next command
    }
  }

  return [];
}

// Kill a single process by PID
async function killSingleProcess(pid: string, platform: string): Promise<void> {
  let killCommand: string;

  switch (platform) {
    case "win32":
      killCommand = `taskkill /F /PID ${pid}`;
      break;
    case "darwin":
    case "linux":
      killCommand = `kill -9 ${pid}`;
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  await execAsync(killCommand);
}

// Helper function to check if Cursor is running (like client-sample)
async function isCursorRunning(): Promise<boolean> {
  const platform = os.platform();

  try {
    switch (platform) {
      case "win32":
        return await checkCursorRunningWindows();
      case "darwin":
        return await checkCursorRunningMacOS();
      case "linux":
        return await checkCursorRunningLinux();
      default:
        return false;
    }
  } catch (error) {
    console.log("Error checking Cursor status:", error);
    return false;
  }
}

// Windows-specific Cursor detection
async function checkCursorRunningWindows(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      'tasklist /FI "IMAGENAME eq Cursor.exe" /FO CSV /NH'
    );
    const lines = stdout
      .trim()
      .split("\n")
      .filter((line) => line.includes("Cursor.exe"));
    return lines.length > 0;
  } catch {
    return false;
  }
}

// macOS-specific Cursor detection
async function checkCursorRunningMacOS(): Promise<boolean> {
  try {
    // First check for main Cursor app process
    const { stdout } = await execAsync(
      "pgrep -f '/Applications/Cursor.app/Contents/MacOS/Cursor'"
    );
    const pids = stdout
      .trim()
      .split("\n")
      .filter((pid) => pid.trim());

    if (pids.length === 0) {
      return false;
    }

    // Validate each PID to ensure it's actually the main Cursor process
    for (const pid of pids) {
      try {
        const { stdout: processInfo } = await execAsync(
          `ps -p ${pid.trim()} -o comm=,args=`
        );
        const lines = processInfo.trim().split("\n");

        for (const line of lines) {
          // Check if it's the main Cursor executable (not helper processes)
          if (
            line.includes("/Applications/Cursor.app/Contents/MacOS/Cursor") &&
            !line.includes("--type=") && // Exclude renderer/utility processes
            !line.includes("Helper")
          ) {
            // Exclude helper processes
            return true;
          }
        }
      } catch {
        // Continue checking other PIDs
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Linux-specific Cursor detection
async function checkCursorRunningLinux(): Promise<boolean> {
  try {
    const commands = [
      "pgrep -f '/usr/bin/cursor'",
      "pgrep -f '/opt/cursor'",
      "pgrep -f '/snap/cursor'",
      "pgrep -x cursor",
    ];

    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command);
        if (stdout.trim().length > 0) {
          return true;
        }
      } catch {
        // Try next command
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Helper function to update storage.json (like client-sample)
async function updateStorageJson(
  paths: CursorPaths,
  newIds: Record<string, string>
): Promise<void> {
  let storageContent: any = {};

  // Read existing storage.json if it exists
  if (fs.existsSync(paths.storage)) {
    try {
      const content = fs.readFileSync(paths.storage, "utf8");
      storageContent = JSON.parse(content);
    } catch (error) {
      console.warn("Could not parse storage.json, creating new one");
      storageContent = {};
    }
  }

  // Update with new IDs (like client-sample)
  storageContent["telemetry.devDeviceId"] = newIds["telemetry.devDeviceId"];
  storageContent["telemetry.macMachineId"] = newIds["telemetry.macMachineId"];
  storageContent["telemetry.machineId"] = newIds["telemetry.machineId"];
  storageContent["telemetry.sqmId"] = newIds["telemetry.sqmId"];

  // Check and remove readonly attribute (like client-sample)
  if (fs.existsSync(paths.storage)) {
    try {
      const stats = fs.statSync(paths.storage);
      if (!(stats.mode & 0o200)) {
        // Check if writable
        console.log("storage.json is readonly, attempting to make writable");
        fs.chmodSync(paths.storage, 0o644);
      }
    } catch (error) {
      console.log("Could not check/modify storage.json permissions:", error);
    }
  }

  // Ensure directory exists
  const storageDir = path.dirname(paths.storage);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Write updated storage.json
  fs.writeFileSync(paths.storage, JSON.stringify(storageContent, null, 2));
  console.log("Successfully updated storage.json");
}

// Helper function to update SQLite database (like client-sample)
async function updateSQLiteDatabase(
  paths: CursorPaths,
  newIds: Record<string, string>
): Promise<void> {
  if (!fs.existsSync(paths.database)) {
    console.log("Database file does not exist, skipping database update");
    return;
  }

  try {
    // Update database with new IDs (like client-sample)
    const updates = [
      { key: "telemetry.devDeviceId", value: newIds["telemetry.devDeviceId"] },
      {
        key: "telemetry.macMachineId",
        value: newIds["telemetry.macMachineId"],
      },
      { key: "telemetry.machineId", value: newIds["telemetry.machineId"] },
      { key: "telemetry.sqmId", value: newIds["telemetry.sqmId"] },
      {
        key: "storage.serviceMachineId",
        value: newIds["telemetry.devDeviceId"],
      },
    ];

    for (const update of updates) {
      const query = `INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('${update.key}', '${update.value}');`;
      await execAsync(`sqlite3 "${paths.database}" "${query}"`);
    }

    console.log("Successfully updated database with new machine IDs");
  } catch (error) {
    console.log("Database update failed:", error);
    // Don't throw error, storage.json update is sufficient
  }
}

// Reset machine IDs following client-sample logic exactly
async function resetMachineIds(
  paths: CursorPaths,
  forceKill = false,
  customDeviceId?: string
): Promise<string> {
  try {
    // 1. Check Cursor processes (like client-sample)
    if (await isCursorRunning()) {
      if (!forceKill) {
        throw new Error(
          "Cursor is currently running. Please close Cursor first or use force kill option."
        );
      }
      console.log("Cursor is running, force killing processes...");

      // 2. Force kill Cursor if requested (like client-sample)
      await killCursorProcesses();

      // 3. Wait for processes to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. Verify all processes are closed
      if (await isCursorRunning()) {
        throw new Error(
          "Failed to close all Cursor processes. Please close Cursor manually and try again."
        );
      }

      console.log("All Cursor processes successfully terminated");
    }

    // 3. Cleanup database entries (like client-sample)
    await cleanupDatabaseEntries(paths);

    // 4. Generate new IDs (like client-sample)
    const newIds = customDeviceId
      ? { ...generateNewIds(), "telemetry.devDeviceId": customDeviceId }
      : generateNewIds();

    // 5. Update storage.json (like client-sample)
    await updateStorageJson(paths, newIds);

    // 6. Update SQLite database (like client-sample)
    await updateSQLiteDatabase(paths, newIds);

    return "✅ Machine IDs reset completed successfully";
  } catch (error) {
    console.error("Error resetting machine IDs:", error);
    return "❌ Failed to reset machine IDs: " + (error as Error).message;
  }
}

// Advanced Database Cleanup Functions

// Clean specific database entries
async function cleanupDatabaseEntries(paths: CursorPaths): Promise<void> {
  if (!fs.existsSync(paths.database)) {
    console.log("Database file does not exist, skipping cleanup");
    return;
  }

  try {
    // Clean specific entries
    const cleanupQueries = [
      "DELETE FROM ItemTable WHERE key LIKE 'telemetry.%';",
      "DELETE FROM ItemTable WHERE key LIKE 'storage.serviceMachineId%';",
      "DELETE FROM ItemTable WHERE key = 'cursorai/serverConfig';",
    ];

    for (const query of cleanupQueries) {
      await execAsync(`sqlite3 "${paths.database}" "${query}"`);
    }

    console.log("Database cleanup completed");
  } catch (error) {
    console.log("Database cleanup failed:", error);
    // Don't throw error, continue with reset
  }
}

// Clean database entries (legacy function - now calls cleanupDatabaseEntries)
async function cleanDatabase(paths: CursorPaths): Promise<string> {
  if (fs.existsSync(paths.database)) {
    try {
      // Use the new cleanup function first
      await cleanupDatabaseEntries(paths);

      // For complete reset, still delete the entire database
      fs.unlinkSync(paths.database);
      return "✅ Database cache cleared";
    } catch (error) {
      console.warn("Could not delete database:", error);
      return "⚠️ Could not clear database cache";
    }
  } else {
    return "ℹ️ Database does not exist";
  }
}

// Restore main.js from backup
async function restoreMainJs(paths: CursorPaths): Promise<string> {
  if (!paths.mainJs) {
    return "⚠️ main.js not found";
  }

  const backupPath = paths.mainJs + ".backup";

  if (fs.existsSync(backupPath)) {
    try {
      const backupContent = fs.readFileSync(backupPath, "utf8");
      fs.writeFileSync(paths.mainJs, backupContent);
      fs.unlinkSync(backupPath); // Remove backup after restore
      return "✅ main.js restored from backup";
    } catch (error) {
      return "❌ Error restoring main.js: " + (error as Error).message;
    }
  } else {
    return "ℹ️ main.js backup not found";
  }
}

// Get machine IDs from Cursor database (following client-sample logic)
async function getMachineIds(): Promise<{
  machineId: string;
  currentAccount: string;
  cursorToken: string;
}> {
  const paths = getCursorPaths();
  const result = {
    machineId: "",
    currentAccount: "",
    cursorToken: "",
  };

  try {
    // Debug: Check which files exist
    console.log("Checking Cursor files:", {
      storageExists: fs.existsSync(paths.storage),
      databaseExists: fs.existsSync(paths.database),
      storagePath: paths.storage,
      databasePath: paths.database,
    });

    // First try to read from storage.json
    if (fs.existsSync(paths.storage)) {
      const storageData = JSON.parse(fs.readFileSync(paths.storage, "utf8"));
      console.log("Storage.json keys:", Object.keys(storageData));

      if (storageData["telemetry.devDeviceId"]) {
        result.machineId = storageData["telemetry.devDeviceId"];
      }

      if (storageData["cursorAuth/cachedEmail"]) {
        result.currentAccount = storageData["cursorAuth/cachedEmail"];
      }

      if (storageData["cursorAuth/accessToken"]) {
        result.cursorToken = storageData["cursorAuth/accessToken"];
      } else if (storageData["cursorAuth/refreshToken"]) {
        result.cursorToken = storageData["cursorAuth/refreshToken"];
      }

      // Check workos.cursor.auth for account info (new auth system)
      if (!result.currentAccount && storageData["workos.cursor.auth"]) {
        try {
          const authData = storageData["workos.cursor.auth"];
          console.log("WorkOS auth data type:", typeof authData);
          console.log("WorkOS auth data keys:", Object.keys(authData));
          console.log(
            "WorkOS auth data full:",
            JSON.stringify(authData, null, 2)
          );

          if (authData.email) {
            result.currentAccount = authData.email;
            console.log("Found account in WorkOS auth:", result.currentAccount);
          }

          if (
            !result.cursorToken &&
            (authData.token || authData.refreshToken)
          ) {
            result.cursorToken = authData.token || authData.refreshToken;
            console.log("Found token in WorkOS auth");
          }
        } catch (error) {
          console.log("Error accessing WorkOS auth data:", error);
        }
      }
    }

    // Try to read from cursor.auth.json (separate auth file)
    if (fs.existsSync(paths.auth)) {
      try {
        const authData = JSON.parse(fs.readFileSync(paths.auth, "utf8"));
        console.log("Auth.json keys:", Object.keys(authData));

        if (!result.currentAccount && authData.email) {
          result.currentAccount = authData.email;
          console.log("Found account in auth.json:", result.currentAccount);
        }

        if (!result.cursorToken && (authData.access_token || authData.token)) {
          result.cursorToken = authData.access_token || authData.token;
          console.log("Found token in auth.json");
        }
      } catch (error) {
        console.log("Error reading auth.json:", error);
      }
    }

    // Try to read from SQLite database (like client-sample does)
    if (fs.existsSync(paths.database)) {
      console.log(
        "Database file exists, attempting to read with sqlite3 command..."
      );

      try {
        // Use sqlite3 command line tool to read database (like client-sample)
        const queries = [
          "SELECT value FROM ItemTable WHERE key = 'telemetry.devDeviceId';",
          "SELECT value FROM ItemTable WHERE key = 'cursorAuth/cachedEmail';",
          "SELECT value FROM ItemTable WHERE key = 'cursorAuth/refreshToken';",
        ];

        for (let i = 0; i < queries.length; i++) {
          const query = queries[i];
          const queryResult = await execAsync(
            `sqlite3 "${paths.database}" "${query}"`
          );
          const value = queryResult.stdout.trim();

          if (value) {
            switch (i) {
              case 0: // Machine ID
                if (!result.machineId) {
                  result.machineId = value;
                  console.log(
                    "Machine ID found in database:",
                    value.substring(0, 8) + "..."
                  );
                }
                break;
              case 1: // Current Account
                result.currentAccount = value;
                console.log("Current account found in database:", value);
                break;
              case 2: // Token
                if (!result.cursorToken) {
                  result.cursorToken = value;
                  console.log(
                    "Token found in database:",
                    value.substring(0, 30) + "..."
                  );
                  console.log("Token length:", value.length);
                  console.log("Token includes '::':", value.includes("::"));
                }
                break;
            }
          }
        }

        console.log(
          "Successfully read from SQLite database using sqlite3 command"
        );
      } catch (error) {
        console.log(
          "Error reading from SQLite database with sqlite3 command:",
          error
        );
        console.log("Falling back to storage.json data");
      }
    } else {
      console.log("Database file does not exist at:", paths.database);
    }

    console.log("Machine IDs loaded:", {
      machineId: result.machineId
        ? `${result.machineId.substring(0, 8)}...`
        : "Not found",
      currentAccount: result.currentAccount || "Not found",
      hasToken: !!result.cursorToken,
    });
  } catch (error) {
    console.error("Error reading machine IDs:", error);
  }

  return result;
}

// Hook/Injection Management

// Regex patterns for machine ID functions
const MACHINE_ID_REGEX =
  /async\s+(\w+)\s*\(\)\s*\{\s*return\s+this\.[\w.]+(?:\?\?|\?)\s*this\.([\w.]+)\.machineId\s*\}/g;
const MAC_MACHINE_ID_REGEX =
  /async\s+(\w+)\s*\(\)\s*\{\s*return\s+this\.[\w.]+(?:\?\?|\?)\s*this\.([\w.]+)\.macMachineId\s*\}/g;

// Check if hook is applied to main.js
async function checkHookStatus(): Promise<boolean> {
  const paths = getCursorPaths();

  try {
    if (!paths.mainJs || !fs.existsSync(paths.mainJs)) {
      return false;
    }

    const content = fs.readFileSync(paths.mainJs, "utf8");

    // Check using regex patterns
    const machineIdMatches = content.match(MACHINE_ID_REGEX);
    const macMachineIdMatches = content.match(MAC_MACHINE_ID_REGEX);

    // If no matches found, it means the hook has been applied
    return (
      !machineIdMatches ||
      machineIdMatches.length === 0 ||
      !macMachineIdMatches ||
      macMachineIdMatches.length === 0
    );
  } catch (error) {
    console.error("Error checking hook status:", error);
    return false;
  }
}

// Apply hook to main.js (inject code to bypass machine ID checks)
async function hookMainJs(forceKill = false): Promise<string> {
  try {
    // 1. Check if Cursor is running
    if (await isCursorRunning()) {
      if (!forceKill) {
        throw new Error(
          "Cursor is currently running. Please close Cursor first or use force kill option."
        );
      }
      console.log("Cursor is running, force killing...");
      await killCursorProcesses();
      // Wait for processes to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 2. Get Cursor paths
    const paths = getCursorPaths();
    if (!paths.mainJs || !fs.existsSync(paths.mainJs)) {
      throw new Error("MAIN_JS_NOT_FOUND: main.js file not found");
    }

    // 3. Read main.js content
    const content = fs.readFileSync(paths.mainJs, "utf8");

    // 4. Create backup if it doesn't exist
    const backupPath = paths.mainJs + ".backup";
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, content);
      console.log("Created backup of main.js");
    }

    // 5. Check if patterns exist
    const machineIdMatches = content.match(MACHINE_ID_REGEX);
    const macMachineIdMatches = content.match(MAC_MACHINE_ID_REGEX);

    if (
      !machineIdMatches ||
      machineIdMatches.length === 0 ||
      !macMachineIdMatches ||
      macMachineIdMatches.length === 0
    ) {
      throw new Error(
        "Cannot find matching machineId or macMachineId functions to hook"
      );
    }

    // 6. Apply replacements
    let modifiedContent = content;

    // Replace machineId functions
    modifiedContent = modifiedContent.replace(
      MACHINE_ID_REGEX,
      (_match, funcName, objName) => {
        return `async ${funcName}() { return this.${objName}.machineId }`;
      }
    );

    // Replace macMachineId functions
    modifiedContent = modifiedContent.replace(
      MAC_MACHINE_ID_REGEX,
      (_match, funcName, objName) => {
        return `async ${funcName}() { return this.${objName}.macMachineId }`;
      }
    );

    // 7. Write modified content
    fs.writeFileSync(paths.mainJs, modifiedContent);

    return "✅ Successfully applied hook to main.js";
  } catch (error) {
    console.error("Error applying hook:", error);
    throw new Error("Failed to apply hook: " + (error as Error).message);
  }
}

// Restore main.js from backup
async function restoreHook(forceKill = false): Promise<string> {
  try {
    // 1. Check if Cursor is running
    if (await isCursorRunning()) {
      if (!forceKill) {
        throw new Error(
          "Cursor is currently running. Please close Cursor first or use force kill option."
        );
      }
      console.log("Cursor is running, force killing...");
      await killCursorProcesses();
      // Wait for processes to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 2. Get Cursor paths
    const paths = getCursorPaths();
    if (!paths.mainJs || !fs.existsSync(paths.mainJs)) {
      throw new Error("MAIN_JS_NOT_FOUND: main.js file not found");
    }

    // 3. Check if backup exists
    const backupPath = paths.mainJs + ".backup";
    if (!fs.existsSync(backupPath)) {
      return "ℹ️ No backup found to restore from";
    }

    // 4. Restore from backup
    const backupContent = fs.readFileSync(backupPath, "utf8");
    fs.writeFileSync(paths.mainJs, backupContent);

    // 5. Remove backup file
    fs.unlinkSync(backupPath);

    return "✅ Successfully restored main.js from backup";
  } catch (error) {
    console.error("Error restoring hook:", error);
    throw new Error("Failed to restore hook: " + (error as Error).message);
  }
}

// Get cursor token from storage
async function getCursorToken(): Promise<string> {
  const paths = getCursorPaths();
  console.log("=== getCursorToken DEBUG START ===");

  try {
    // Try to get token from SQLite database first (more reliable)
    if (fs.existsSync(paths.database)) {
      try {
        const query = `
          SELECT key, value
          FROM ItemTable
          WHERE key LIKE '%workos.cursor.auth%' OR key LIKE '%cursorAuth%'
          ORDER BY key
        `;

        const { stdout } = await execAsync(
          `sqlite3 "${paths.database}" "${query}"`
        );

        console.log(
          "Database query result:",
          stdout ? stdout.substring(0, 200) + "..." : "empty"
        );

        if (stdout.trim()) {
          const lines = stdout.trim().split("\n");
          for (const line of lines) {
            try {
              // Split by first | to separate key and value
              const parts = line.split("|");
              if (parts.length >= 2) {
                const key = parts[0];
                const value = parts.slice(1).join("|"); // Rejoin in case value contains |
                console.log("Database key:", key);
                console.log(
                  "Database value preview:",
                  value.substring(0, 100) + "..."
                );

                const authData = JSON.parse(value);
                console.log("Parsed auth data keys:", Object.keys(authData));
                if (authData.token) {
                  console.log(
                    "Token from database:",
                    authData.token.substring(0, 30) + "..."
                  );
                  console.log(
                    "Token includes '::':",
                    authData.token.includes("::")
                  );
                  console.log("Token length:", authData.token.length);

                  // Return any token from database, even if it doesn't have :: format
                  if (authData.token !== "mock-token") {
                    console.log("Found real token from database");
                    return authData.token;
                  }
                }
              }
            } catch (error) {
              console.log(
                "Failed to parse line:",
                line.substring(0, 50) + "...",
                error.message
              );
            }
          }
        }
      } catch (error) {
        console.log("Failed to read token from database:", error);
      }
    }

    // Fallback to storage.json
    if (fs.existsSync(paths.storage)) {
      const storageData = JSON.parse(fs.readFileSync(paths.storage, "utf8"));

      // Try standard auth tokens first
      let token =
        storageData["cursorAuth/accessToken"] ||
        storageData["cursorAuth/refreshToken"];

      // Try WorkOS auth if standard tokens not found
      if (!token && storageData["workos.cursor.auth"]) {
        try {
          const authData = storageData["workos.cursor.auth"];
          token = authData.token || authData.refreshToken || "";
          console.log(
            "Token from storage.json:",
            token ? token.substring(0, 20) + "..." : "none"
          );
        } catch (error) {
          console.log("Error accessing WorkOS auth for token:", error);
        }
      }

      // Try cursor.auth.json if still no token
      if (!token && fs.existsSync(paths.auth)) {
        try {
          const authData = JSON.parse(fs.readFileSync(paths.auth, "utf8"));
          token = authData.access_token || authData.token || "";
          console.log(
            "Token from auth.json:",
            token ? token.substring(0, 20) + "..." : "none"
          );
        } catch (error) {
          console.log("Error reading auth.json for token:", error);
        }
      }

      console.log(
        "Final token format check:",
        token
          ? token.includes("::")
            ? "valid format"
            : "invalid format"
          : "no token"
      );
      return token || "";
    }
  } catch (error) {
    console.error("Error reading cursor token:", error);
  }

  return "";
}

// Switch Cursor account (following client-sample logic)
async function switchCursorAccount(options: {
  email: string;
  token: string;
  forceKill?: boolean;
}): Promise<string> {
  try {
    const { email, token, forceKill = false } = options;
    console.log("Starting account switch for:", email);

    // 1. Check if Cursor is running
    if (await isCursorRunning()) {
      if (!forceKill) {
        throw new Error(
          "Cursor is currently running. Please close Cursor first or use force kill option."
        );
      }
      console.log("Cursor is running, force killing...");
      await killCursorProcesses();
      // Wait for processes to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 2. Get Cursor paths
    const paths = getCursorPaths();

    // 3. Update cursor.auth.json (following client-sample pattern)
    try {
      const authData = {
        email: email,
        access_token: token
      };

      // Ensure directory exists
      const authDir = path.dirname(paths.auth);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      fs.writeFileSync(paths.auth, JSON.stringify(authData, null, 2));
      console.log("Successfully updated cursor.auth.json");
    } catch (error) {
      console.log("Error updating cursor.auth.json:", error);
      // Don't throw error, continue with database update
    }

    // 4. Note: client-sample does NOT update storage.json during account switch
    // They only update storage.json during machine ID reset
    // So we skip storage.json update to match their behavior exactly
    console.log(
      "Skipping storage.json update (following client-sample pattern)"
    );

    // 5. Update SQLite database ONLY (following client-sample pattern exactly)
    if (fs.existsSync(paths.database)) {
      try {
        console.log("Updating Cursor database with new account info...");

        // Process token - split by %3A%3A and take second part if exists (client-sample logic)
        const processedToken = token.includes("%3A%3A")
          ? token.split("%3A%3A")[1] || token
          : token;

        // Open database connection
        const db = new Database(paths.database);

        const updates = [
          { key: "cursor.email", value: email },
          { key: "cursor.accessToken", value: processedToken },
          { key: "cursorAuth/refreshToken", value: processedToken },
          { key: "cursorAuth/accessToken", value: processedToken },
          { key: "cursorAuth/cachedEmail", value: email },
        ];

        // Update each key-value pair
        const updateStmt = db.prepare(
          "UPDATE ItemTable SET value = ? WHERE key = ?"
        );
        const insertStmt = db.prepare(
          "INSERT INTO ItemTable (key, value) VALUES (?, ?)"
        );

        for (const update of updates) {
          console.log(`Updating database key: ${update.key}`);

          // Try to update first
          const result = updateStmt.run(update.value, update.key);

          // If no rows were updated, insert new record
          if (result.changes === 0) {
            console.log(`Key ${update.key} not found, inserting new record`);
            insertStmt.run(update.key, update.value);
          }
        }

        db.close();
        console.log("Successfully updated database with new account");
      } catch (error) {
        console.log("Database update failed:", error);
        // Don't throw error, storage.json update is sufficient
      }
    }

    return `✅ Successfully switched to account: ${email}`;
  } catch (error) {
    console.error("Error switching account:", error);
    throw new Error("Failed to switch account: " + (error as Error).message);
  }
}

// Admin Privileges Management (following Rust implementation)

// Check if current process has admin privileges
async function checkAdminPrivileges(): Promise<boolean> {
  const platform = os.platform();
  console.log("🔍 checkAdminPrivileges - Platform:", platform);

  try {
    if (platform === "win32") {
      // Windows: Check if running as administrator
      const { stdout } = await execAsync(
        'powershell -WindowStyle Hidden -Command "([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] \'Administrator\')"'
      );
      const hasAdmin = stdout.trim().toLowerCase() === "true";
      console.log("🪟 Windows admin check result:", hasAdmin);
      return hasAdmin;
    } else if (platform === "darwin") {
      // macOS: Check if user is in admin group
      try {
        const { stdout } = await execAsync("groups");
        console.log("🍎 macOS groups output:", stdout);
        const hasAdmin = stdout.includes("admin");
        console.log("🍎 macOS admin check result:", hasAdmin);
        return hasAdmin;
      } catch (error) {
        console.log("🍎 macOS groups command failed, trying fallback:", error);
        // Fallback: check if we can write to system directories
        try {
          await execAsync("test -w /usr/local/bin");
          console.log("🍎 macOS fallback: can write to /usr/local/bin");
          return true;
        } catch {
          console.log("🍎 macOS fallback: cannot write to /usr/local/bin");
          return false;
        }
      }
    } else if (platform === "linux") {
      // Linux: Check if user is root or in sudo group
      try {
        const { stdout } = await execAsync("id -u");
        if (stdout.trim() === "0") {
          console.log("🐧 Linux: Running as root");
          return true; // Root user
        }

        // Check if user is in sudo group
        const { stdout: groups } = await execAsync("groups");
        console.log("🐧 Linux groups output:", groups);
        const hasAdmin = groups.includes("sudo") || groups.includes("wheel");
        console.log("🐧 Linux admin check result:", hasAdmin);
        return hasAdmin;
      } catch (error) {
        console.log("🐧 Linux admin check failed:", error);
        return false;
      }
    }

    console.log("❓ Unknown platform, returning false");
    return false;
  } catch (error) {
    console.error("❌ Error checking admin privileges:", error);
    return false;
  }
}

// Request admin privileges (restart with elevated permissions)
async function requestAdminPrivileges(): Promise<boolean> {
  const platform = os.platform();

  try {
    if (platform === "win32") {
      // Windows: Use PowerShell to restart with admin privileges
      const exePath = process.execPath;
      const args = process.argv.slice(1).join(" ");

      const command = `Start-Process -FilePath "${exePath}" -ArgumentList "${args}" -Verb RunAs`;

      try {
        await execAsync(`powershell -WindowStyle Hidden -Command "${command}"`);
        return true;
      } catch (error) {
        console.error("Failed to request admin privileges:", error);
        return false;
      }
    } else if (platform === "darwin") {
      // macOS: Use osascript to request admin privileges
      const exePath = process.execPath;
      const args = process.argv.slice(1).join(" ");

      const script = `do shell script "${exePath} ${args}" with administrator privileges`;

      try {
        await execAsync(`osascript -e '${script}'`);
        return true;
      } catch (error) {
        console.error("Failed to request admin privileges:", error);
        return false;
      }
    } else if (platform === "linux") {
      // Linux: Use pkexec or gksudo to request admin privileges
      const exePath = process.execPath;
      const args = process.argv.slice(1).join(" ");

      try {
        // Try pkexec first
        await execAsync(`pkexec ${exePath} ${args}`);
        return true;
      } catch {
        try {
          // Fallback to gksudo
          await execAsync(`gksudo ${exePath} ${args}`);
          return true;
        } catch (error) {
          console.error("Failed to request admin privileges:", error);
          return false;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error requesting admin privileges:", error);
    return false;
  }
}

// Check if admin privileges are required for operations
async function isAdminRequired(): Promise<boolean> {
  const platform = os.platform();
  const paths = getCursorPaths();
  console.log("🔍 isAdminRequired - Platform:", platform);
  console.log("🔍 isAdminRequired - Cursor paths:", paths);

  try {
    // Test write access to critical paths
    if (platform === "win32") {
      // Windows: Check if we can write to Cursor installation directory
      if (paths.mainJs) {
        const cursorDir = path.dirname(paths.mainJs);
        console.log("🪟 Testing write access to:", cursorDir);
        try {
          const testFile = path.join(cursorDir, ".write_test");
          fs.writeFileSync(testFile, "test");
          fs.unlinkSync(testFile);
          console.log("🪟 Write test successful - no admin required");
          return false; // No admin required
        } catch (error) {
          console.log("🪟 Write test failed - admin required:", error);
          return true; // Admin required
        }
      }
    } else if (platform === "darwin") {
      // macOS: Check if we can write to Applications directory
      if (paths.mainJs && paths.mainJs.includes("/Applications/")) {
        console.log("🍎 Cursor is in /Applications, testing write access");
        try {
          const testFile = "/Applications/.write_test";
          fs.writeFileSync(testFile, "test");
          fs.unlinkSync(testFile);
          console.log("🍎 Write test to /Applications successful - no admin required");
          return false; // No admin required
        } catch (error) {
          console.log("🍎 Write test to /Applications failed - admin required:", error);
          return true; // Admin required
        }
      } else {
        console.log("🍎 Cursor is not in /Applications, checking main.js directory");
        if (paths.mainJs) {
          const cursorDir = path.dirname(paths.mainJs);
          console.log("🍎 Testing write access to:", cursorDir);
          try {
            const testFile = path.join(cursorDir, ".write_test");
            fs.writeFileSync(testFile, "test");
            fs.unlinkSync(testFile);
            console.log("🍎 Write test successful - no admin required");
            return false; // No admin required
          } catch (error) {
            console.log("🍎 Write test failed - admin required:", error);
            return true; // Admin required
          }
        }
      }
    }

    console.log("❓ No specific checks for platform, assuming no admin required");
    return false;
  } catch (error) {
    console.error("❌ Error checking admin requirements:", error);
    return true; // Assume admin required on error
  }
}

// Export Cursor database and storage.json files
async function exportCursorData(): Promise<{
  success: boolean;
  message: string;
  exportPath?: string;
  filesExported?: string[];
}> {
  try {
    // Get Cursor paths
    const paths = getCursorPaths();

    // Show save dialog to let user choose export location
    const result = await dialog.showSaveDialog({
      title: "Export Cursor Data",
      defaultPath: `cursor-data-export-${new Date().toISOString().slice(0, 10)}.zip`,
      filters: [
        { name: "ZIP Archive", extensions: ["zip"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return {
        success: false,
        message: "Export cancelled by user"
      };
    }

    const exportPath = result.filePath;
    const tempDir = path.join(os.tmpdir(), `cursor-export-${Date.now()}`);

    // Create temporary directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filesExported: string[] = [];

    // Copy storage.json if it exists
    if (fs.existsSync(paths.storage)) {
      const storageDestination = path.join(tempDir, "storage.json");
      fs.copyFileSync(paths.storage, storageDestination);
      filesExported.push("storage.json");
    }

    // Copy cursor.auth.json if it exists (following client-sample logic)
    console.log("🔍 Checking auth file at:", paths.auth);
    console.log("🔍 Auth file exists:", fs.existsSync(paths.auth));

    if (fs.existsSync(paths.auth)) {
      const authDestination = path.join(tempDir, "cursor.auth.json");
      fs.copyFileSync(paths.auth, authDestination);
      filesExported.push("cursor.auth.json");
      console.log("✅ Auth file copied successfully");
    } else {
      console.log("⚠️ Auth file not found at expected location");
      console.log("📁 Expected path:", paths.auth);
      console.log("📁 Storage path (for reference):", paths.storage);
      console.log("📁 Database path (for reference):", paths.database);

      // Check if the globalStorage directory exists
      const globalStorageDir = path.dirname(paths.auth);
      console.log("📁 GlobalStorage directory exists:", fs.existsSync(globalStorageDir));

      if (fs.existsSync(globalStorageDir)) {
        console.log("� Contents of globalStorage directory:");
        try {
          const files = fs.readdirSync(globalStorageDir);
          files.forEach(file => {
            console.log("  -", file);
          });
        } catch (error) {
          console.log("  Error reading directory:", error);
        }
      }
    }

    // Copy database if it exists
    if (fs.existsSync(paths.database)) {
      const dbDestination = path.join(tempDir, "state.vscdb");
      fs.copyFileSync(paths.database, dbDestination);
      filesExported.push("state.vscdb");
    }

    // Create metadata file with export info
    const metadata = {
      exportDate: new Date().toISOString(),
      cursorPaths: paths,
      platform: os.platform(),
      exportedFiles: filesExported,
      note: "Exported Cursor data for research purposes"
    };

    const metadataPath = path.join(tempDir, "export-metadata.json");
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    filesExported.push("export-metadata.json");

    // For simplicity, create a folder instead of ZIP
    const finalExportPath = exportPath.replace('.zip', '');

    // Create export directory
    if (!fs.existsSync(finalExportPath)) {
      fs.mkdirSync(finalExportPath, { recursive: true });
    }

    // Copy files to export directory
    for (const file of fs.readdirSync(tempDir)) {
      const sourcePath = path.join(tempDir, file);
      const destPath = path.join(finalExportPath, file);
      fs.copyFileSync(sourcePath, destPath);
    }

    // Clean up temporary directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("Could not clean up temp directory:", error);
    }

    return {
      success: true,
      message: `Successfully exported ${filesExported.length} files to ${finalExportPath}`,
      exportPath: finalExportPath,
      filesExported
    };

  } catch (error) {
    console.error("Export error:", error);
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export function setupIpcHandlers() {
  // Main reset handler
  ipcMain.handle("reset-cursor", async (_event, _options) => {
    try {
      console.log("Starting Cursor reset...");

      // Get Cursor paths
      const paths = getCursorPaths();
      console.log("Cursor paths:", paths);

      // Step 1: Kill Cursor processes
      const killResult = await killCursorProcesses();
      console.log("Kill result:", killResult);

      // Wait a bit for processes to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Reset machine IDs
      const resetResult = await resetMachineIds(paths, false);
      console.log("Reset result:", resetResult);

      // Step 3: Clean database
      const cleanResult = await cleanDatabase(paths);
      console.log("Clean result:", cleanResult);

      // Step 4: Restore main.js if backup exists
      const restoreResult = await restoreMainJs(paths);
      console.log("Restore result:", restoreResult);

      return {
        success: true,
        message: "Cursor reset completed!",
        details: {
          kill: killResult,
          reset: resetResult,
          clean: cleanResult,
          restore: restoreResult,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Reset error:", errorMessage);
      throw new Error(errorMessage);
    }
  });

  // Individual handlers for testing
  ipcMain.handle("get-cursor-paths", async () => {
    return getCursorPaths();
  });

  ipcMain.handle("kill-cursor-processes", async () => {
    return await killCursorProcesses();
  });

  ipcMain.handle(
    "reset-machine-ids",
    async (_event, forceKill = false, customDeviceId) => {
      const paths = getCursorPaths();
      return await resetMachineIds(paths, forceKill, customDeviceId);
    }
  );

  ipcMain.handle("clean-database", async (_event, paths) => {
    return await cleanDatabase(paths);
  });

  ipcMain.handle("restore-main-js", async (_event, paths) => {
    return await restoreMainJs(paths);
  });

  // Device info handlers
  ipcMain.handle("get-machine-ids", async () => {
    return await getMachineIds();
  });

  ipcMain.handle("check-hook-status", async () => {
    return await checkHookStatus();
  });

  ipcMain.handle("check-cursor-running", async () => {
    return await isCursorRunning();
  });

  ipcMain.handle("get-cursor-token", async () => {
    return await getCursorToken();
  });

  // Account switching handler
  ipcMain.handle("switch-cursor-account", async (_event, options) => {
    return await switchCursorAccount(options);
  });

  // Hook/Injection Management handlers
  ipcMain.handle("hook-main-js", async (_event, forceKill = false) => {
    return await hookMainJs(forceKill);
  });

  ipcMain.handle("restore-hook", async (_event, forceKill = false) => {
    return await restoreHook(forceKill);
  });

  // Advanced Path Management handlers
  ipcMain.handle("get-running-cursor-path", async () => {
    return await getRunningCursorPath();
  });

  ipcMain.handle(
    "validate-cursor-path",
    async (_event, selectedPath: string) => {
      return await validateCursorPath(selectedPath);
    }
  );

  ipcMain.handle(
    "find-main-js-from-path",
    async (_event, selectedPath: string) => {
      return findMainJsFromSelectedPath(selectedPath);
    }
  );

  // Database cleanup handler
  ipcMain.handle("cleanup-database-entries", async () => {
    const paths = getCursorPaths();
    await cleanupDatabaseEntries(paths);
    return "✅ Database entries cleaned up";
  });

  // Admin privileges handlers
  ipcMain.handle("check-admin-privileges", async () => {
    return await checkAdminPrivileges();
  });

  ipcMain.handle("request-admin-privileges", async () => {
    return await requestAdminPrivileges();
  });

  ipcMain.handle("is-admin-required", async () => {
    return await isAdminRequired();
  });

  // API proxy handler for authentication
  ipcMain.handle(
    "api-request",
    async (_event, { url, method, body, headers }) => {
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        };

        const req = https.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              const response = {
                status: res.statusCode,
                statusText: res.statusMessage,
                headers: res.headers,
                data: data ? JSON.parse(data) : null,
              };
              resolve(response);
            } catch (error) {
              resolve({
                status: res.statusCode,
                statusText: res.statusMessage,
                headers: res.headers,
                data: data,
              });
            }
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        if (body) {
          req.write(typeof body === "string" ? body : JSON.stringify(body));
        }

        req.end();
      });
    }
  );

  // Export handler
  ipcMain.handle("export-cursor-data", async () => {
    return await exportCursorData();
  });

  // Debug handler to check cursor paths
  ipcMain.handle("debug-cursor-paths", async () => {
    const paths = getCursorPaths();
    const result = {
      paths,
      fileExists: {
        storage: fs.existsSync(paths.storage),
        auth: fs.existsSync(paths.auth),
        database: fs.existsSync(paths.database),
      }
    };
    console.log("🔍 Debug cursor paths:", result);
    return result;
  });
}
