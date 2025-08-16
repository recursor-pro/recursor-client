import React, { useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";
import DashboardView from "../views/DashboardView";
import HistoryView from "../views/HistoryView";
import AccountsView from "../views/AccountsView";
import SettingsView from "../views/SettingsView";
import type { MenuItem } from "../types";

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();

  const menuItems: MenuItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: "🏠",
      path: "/dashboard",
    },
    {
      key: "accounts",
      label: "Account History",
      icon: "👥",
      path: "/accounts",
    },
    {
      key: "history",
      label: "History",
      icon: "📝",
      path: "/history",
    },
    {
      key: "settings",
      label: "Settings",
      icon: "⚙️",
      path: "/settings",
    },
  ];

  const currentPath = location.pathname.substring(1) || "dashboard";

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`min-h-screen flex ${isDark ? "dark" : ""}`}>
      {/* Drag Region */}
      <div className="fixed top-0 left-0 right-0 h-8 z-50 drag-region" />

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
          collapsed ? "w-16" : "w-52"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white select-none">
            {collapsed ? "R" : "Recursor"}
          </h2>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {collapsed ? "→" : "←"}
        </button>

        {/* Menu */}
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.path)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                currentPath === item.key
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="text-xl mr-3">{item.icon}</span>
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-52"
        }`}
      >
        <div className="pt-8 px-6 pb-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/accounts" element={<AccountsView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
