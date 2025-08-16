import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Users, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import { ToastProvider, useToast } from "../components/ToastContainer";
import DashboardView from "../views/DashboardView";
import AccountsView from "../views/AccountsView";
import SettingsView from "../views/SettingsView";
import type { MenuItem } from "../types";

// Inner component that uses auth and toast hooks
const MainContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const auth = useAuth();
  const toast = useToast();

  // Validate access key on app startup
  useEffect(() => {
    const validateOnStartup = async () => {
      if (auth.isAuthenticated) {
        const isValid = await auth.validateAndLogoutIfInvalid();
        if (!isValid) {
          toast.showError("Authentication Failed", "Your access key has expired or is invalid. Please login again.");
        }
      }
    };

    validateOnStartup();
  }, []); // Run only once on mount

  const menuItems: MenuItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <Home size={20} />,
      path: "/dashboard",
    },
    {
      key: "accounts",
      label: "Accounts",
      icon: <Users size={20} />,
      path: "/accounts",
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={20} />,
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
        className={`fixed left-0 top-0 h-full bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700 transition-all duration-300 z-40 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-secondary-200 dark:border-secondary-700">
          {collapsed ? (
            <Logo size="sm" showText={false} />
          ) : (
            <Logo size="sm" showText={true} />
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-600 rounded-full flex items-center justify-center text-secondary-600 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-all duration-200 shadow-medium hover:shadow-large"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Menu */}
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.path)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all duration-200 ${
                currentPath === item.key
                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-3 border-primary-600"
                  : "text-secondary-700 dark:text-secondary-300"
              }`}
            >
              <span className="flex-shrink-0 mr-3">{item.icon}</span>
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
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
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        <div className="pt-8 px-6 pb-6 bg-secondary-50 dark:bg-secondary-800 min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/accounts" element={<AccountsView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  return (
    <ToastProvider>
      <MainContent />
    </ToastProvider>
  );
};

export default MainLayout;
