import React, { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../components/ToastContainer";
import { exportCursorData, debugCursorPaths } from "../utils/ipcUtils";

const SettingsView: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const [autoStart, setAutoStart] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const result = await exportCursorData();

      if (result.success) {
        toast.showSuccess(
          "Export Successful!",
          `Files exported: ${result.filesExported?.join(", ")}\nLocation: ${result.exportPath}`,
          8000
        );
      } else {
        toast.showError("Export Failed", result.message);
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.showError(
        "Export Failed",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDebugPaths = async () => {
    try {
      const result = await debugCursorPaths();
      console.log("Debug paths result:", result);
      toast.showSuccess(
        "Debug Paths",
        `Check console for detailed path information`,
        5000
      );
    } catch (error) {
      console.error("Debug error:", error);
      toast.showError(
        "Debug Failed",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const handleImportData = () => {
    console.log("Import data");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your Recursor preferences
        </p>
      </div>

      {/* Appearance Settings */}
      <Card title="Appearance">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Theme
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose your preferred theme
              </p>
            </div>
            <Button onClick={toggleTheme} variant="secondary" size="sm">
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Application Settings */}
      {/* <Card title="Application">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Auto Start
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start Recursor when system boots
              </p>
            </div>
            <button
              onClick={() => setAutoStart(!autoStart)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoStart ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoStart ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Notifications
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Show desktop notifications
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card> */}

      {/* Data Management */}
      {/* <Card title="Data Management">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Export Cursor Data
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Export your Cursor data files for research purposes:
              <br />• <strong>storage.json</strong> - Machine IDs and configuration
              <br />• <strong>cursor.auth.json</strong> - Authentication credentials
              <br />• <strong>state.vscdb</strong> - SQLite database
              <br />• <strong>export-metadata.json</strong> - Export information
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleExportData}
                variant="secondary"
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? "📤 Exporting..." : "📤 Export Database & Storage"}
              </Button>
              <Button
                onClick={handleDebugPaths}
                variant="outline"
                className="w-full text-xs"
              >
                🔍 Debug Paths
              </Button>
            </div>
          </div>
        </div>
      </Card> */}

      {/* About */}
      <Card title="About">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Recursor
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Version 1.0.0
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Authors
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Recursor Team
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsView;
