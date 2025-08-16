import React, { useState } from "react";

interface CursorResetProps {
  onResetComplete?: () => void;
}

const CursorReset: React.FC<CursorResetProps> = ({ onResetComplete }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setResetStatus("Resetting Cursor...");

      // Check if Electron API is available
      if (!window.electronAPI) {
        throw new Error("Electron API is not available");
      }

      setResetStatus("🔄 Starting Cursor reset...");

      const result = await window.electronAPI.resetCursor({});

      // Show detailed results
      if (result.details) {
        setResetStatus(`🔄 ${result.details.kill}`);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setResetStatus(`🆔 ${result.details.reset}`);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setResetStatus(`🗄️ ${result.details.clean}`);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setResetStatus(`📄 ${result.details.restore}`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setResetStatus("🎉 Cursor reset completed!");
      onResetComplete?.();

      setTimeout(() => {
        setResetStatus("");
        setShowConfirm(false);
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setResetStatus(`❌ Error: ${errorMessage}`);

      setTimeout(() => {
        setResetStatus("");
      }, 5000);
    } finally {
      setIsResetting(false);
    }
  };

  const confirmReset = () => {
    setShowConfirm(true);
  };

  const cancelReset = () => {
    setShowConfirm(false);
  };

  return (
    <div className="text-center">
      <h3 className="text-2xl mb-4 text-gray-700 font-semibold">🔄 Reset Cursor</h3>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed">
        Reset Cursor to default state (new Machine ID, clear config, restore
        hooks)
      </p>

      {!showConfirm ? (
        <button
          onClick={confirmReset}
          disabled={isResetting}
          className="px-6 py-3 bg-yellow-400 text-gray-900 border-2 border-yellow-400 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 min-w-20 hover:-translate-y-0.5 hover:shadow-button hover:bg-yellow-500 hover:border-yellow-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isResetting ? "Resetting..." : "Reset Cursor"}
        </button>
      ) : (
        <div className="bg-white p-6 rounded-xl border-2 border-red-500 mt-4">
          <p className="text-lg mb-4 text-red-500 font-medium">
            ⚠️ <strong>Confirm Cursor reset?</strong>
          </p>
          <p className="text-sm text-gray-700 mb-6 text-left leading-relaxed">
            This operation will:
            <br />• Close all Cursor processes
            <br />• Generate new Machine ID
            <br />• Clear configuration and cache
            <br />• Restore hooks to original state
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-6 py-3 bg-red-500 text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 min-w-20 hover:-translate-y-0.5 hover:shadow-button hover:bg-red-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isResetting ? "Resetting..." : "Confirm Reset"}
            </button>
            <button
              onClick={cancelReset}
              disabled={isResetting}
              className="px-6 py-3 bg-gray-500 text-white border-0 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 min-w-20 hover:-translate-y-0.5 hover:shadow-button hover:bg-gray-600 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {resetStatus && (
        <div
          className={`mt-4 p-4 rounded-lg font-medium ${
            resetStatus.includes("❌")
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-green-100 text-green-800 border border-green-200"
          }`}
        >
          {resetStatus}
        </div>
      )}
    </div>
  );
};

export default CursorReset;
