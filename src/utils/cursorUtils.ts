// Electron IPC communication

interface ResetOptions {
  onProgress?: (message: string) => void;
  forceKill?: boolean;
}

// Main reset function using Electron IPC
export async function resetCursor(options: ResetOptions = {}): Promise<void> {
  const { onProgress } = options;

  try {
    onProgress?.("🔄 Starting Cursor reset...");

    // Check if Electron API is available
    if (!window.electronAPI) {
      throw new Error("Electron API is not available. Please run in Electron app.");
    }

    onProgress?.("📁 Getting Cursor path information...");

    // Use Electron IPC to perform reset operations
    // Don't pass functions through IPC - they can't be cloned
    const result = await window.electronAPI.resetCursor({});

    // Show detailed results
    if (result.details) {
      onProgress?.(`🔄 ${result.details.kill}`);
      onProgress?.(`🆔 ${result.details.reset}`);
      onProgress?.(`🗄️ ${result.details.clean}`);
      onProgress?.(`📄 ${result.details.restore}`);
    }

    onProgress?.("🎉 Cursor reset completed!");

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    onProgress?.(`❌ Reset error: ${errorMessage}`);
    throw error;
  }
}
