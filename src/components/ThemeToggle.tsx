import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-all duration-200 shadow-button hover:shadow-button-hover"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun size={18} className="text-secondary-700 dark:text-secondary-300" />
      ) : (
        <Moon size={18} className="text-secondary-700 dark:text-secondary-300" />
      )}
    </button>
  );
};

export default ThemeToggle;
