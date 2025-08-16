import React, { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import { useTheme } from "../hooks/useTheme";

const SettingsView: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [autoStart, setAutoStart] = useState(false);
  const [notifications, setNotifications] = useState(false);

  const handleSaveSettings = () => {
    console.log("Settings saved");
  };

  const handleExportData = () => {
    console.log("Export data");
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
      <Card title="Application">
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
      </Card>

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
              Original authors: Recursor Team
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} variant="primary">
          💾 Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsView;
