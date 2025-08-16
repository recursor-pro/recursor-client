import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import KeyActivation from "../components/KeyActivation";
import UserKeyInfo from "../components/UserKeyInfo";
import QuickChange from "../components/QuickChange";
import { deviceService, type DeviceInfoState } from "../services/deviceService";
import { useAuth } from "../hooks/useAuth";

const DashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfoState>({
    machineId: "",
    currentAccount: "",
    cursorToken: "",
    hookStatus: null,
    cursorRunning: false,
  });

  // Use authentication hook
  const auth = useAuth();

  // State for success/error messages
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load device info on component mount
  useEffect(() => {
    const loadDeviceInfo = async () => {
      try {
        setLoading(true);
        const info = await deviceService.getDeviceInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error("Failed to load device info:", error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    loadDeviceInfo();
  }, []);

  // Refresh device info
  const handleRefreshDeviceInfo = async () => {
    try {
      setLoading(true);
      const info = await deviceService.refreshDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error("Failed to refresh device info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetCursor = async () => {
    try {
      // Ask user for confirmation before resetting
      const confirmed = window.confirm(
        "⚠️ Confirm Cursor Reset?\n\n" +
          "This operation will:\n" +
          "• Close all Cursor processes\n" +
          "• Generate new Machine ID\n" +
          "• Clear configuration and cache\n" +
          "• Restore hooks to original state\n\n" +
          "Click OK to proceed or Cancel to abort."
      );

      if (!confirmed) {
        return;
      }

      setLoading(true);
      setMessage({
        type: "success",
        text: "🔄 Starting Cursor reset...",
      });

      // Check if Electron API is available
      if (!window.electronAPI) {
        throw new Error("Electron API is not available. Please run in Electron app.");
      }

      // Perform the reset using the existing API
      const result = await window.electronAPI.resetCursor({});

      // Show success message with details
      let successMessage = "🎉 Cursor reset completed successfully!";
      if (result.details) {
        successMessage += `\n\n• ${result.details.kill}\n• ${result.details.reset}\n• ${result.details.clean}\n• ${result.details.restore}`;
      }

      setMessage({
        type: "success",
        text: successMessage,
      });

      // Refresh device info to show updated state
      await handleRefreshDeviceInfo();

      // Clear message after 8 seconds (longer for reset completion)
      setTimeout(() => setMessage(null), 8000);

    } catch (error) {
      console.error("Failed to reset cursor:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      setMessage({
        type: "error",
        text: `❌ Failed to reset cursor: ${errorMessage}`,
      });

      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeMachineId = async () => {
    try {
      setLoading(true);

      // Check if Cursor is running
      let forceKill = false;
      if (window.electronAPI) {
        const isRunning = await window.electronAPI.checkCursorRunning();

        if (isRunning) {
          // Ask user if they want to force kill Cursor if it's running
          forceKill = window.confirm(
            "⚠️ Cursor is Running!\n\n" +
              "Do you want to automatically close Cursor to continue resetting Machine ID?\n\n" +
              "Click OK to close Cursor and continue, or Cancel to abort."
          );

          if (!forceKill) {
            setLoading(false);
            return; // User cancelled
          }
        }
      }

      // Call the reset machine IDs function
      const result = await window.electronAPI.resetMachineIds(forceKill);

      if (result.includes("❌")) {
        throw new Error(result.replace("❌ Failed to reset machine IDs: ", ""));
      }

      // Refresh device info to show new machine ID
      const updatedInfo = await deviceService.refreshDeviceInfo();
      setDeviceInfo(updatedInfo);

      // Show success message
      setMessage({
        type: "success",
        text: `✅ Machine ID reset successfully!\n\nNew Machine ID: ${updatedInfo.machineId.substring(0, 8)}...`,
      });

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);

    } catch (error) {
      console.error("Failed to reset machine ID:", error);
      setMessage({
        type: "error",
        text: `❌ Failed to reset machine ID: ${(error as Error).message}`,
      });

      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your Recursor status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Information */}
        <Card title="Device Information">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Machine ID
              </label>
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {deviceInfo.machineId || "Not available"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Current Account
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {deviceInfo.currentAccount || "Not logged in"}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Hook Status
                </label>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      deviceInfo.hookStatus === true
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : deviceInfo.hookStatus === false
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {deviceInfo.hookStatus === true
                      ? "✅ Active"
                      : deviceInfo.hookStatus === false
                        ? "❌ Inactive"
                        : "❓ Unknown"}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Cursor Status
              </label>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    deviceInfo.cursorRunning
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {deviceInfo.cursorRunning ? "🟢 Running" : "🔴 Not Running"}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleRefreshDeviceInfo}
                variant="secondary"
                disabled={loading}
                className="w-full text-xs"
              >
                {loading ? "🔄 Refreshing..." : "🔄 Refresh Info"}
              </Button>
            </div>
          </div>
        </Card>

        {/* User Information */}
        <Card title="User Information">
          {auth.isAuthenticated && auth.accessKey ? (
            <UserKeyInfo
              accessKey={auth.accessKey}
              maskedKey={auth.maskedKey}
              usagePercentage={auth.usagePercentage}
              formattedExpiry={auth.formattedExpiry}
              isExpired={auth.isExpired}
              onCopyKey={auth.copyKey}
              onLogout={auth.logout}
            />
          ) : (
            <KeyActivation
              onActivate={auth.activateKey}
              loading={auth.loading}
            />
          )}
        </Card>

        {/* Quick Change */}
        {auth.isAuthenticated && (
          <Card title="Quick Change">
            <QuickChange
              onSuccess={() => {
                setMessage({
                  type: "success",
                  text: "Account switched successfully! Please restart Cursor to use the new account.",
                });
                setTimeout(() => setMessage(null), 5000);
              }}
              onError={(error) => {
                setMessage({ type: "error", text: error });
                setTimeout(() => setMessage(null), 5000);
              }}
            />
          </Card>
        )}
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
              : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {message.type === "success" ? (
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm">{message.text}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setMessage(null)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={handleChangeMachineId} variant="secondary">
            Change Machine ID
          </Button>
          <Button onClick={handleResetCursor} variant="primary" disabled={loading}>
            {loading ? "🔄 Resetting..." : "🔄 Reset Cursor"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DashboardView;
