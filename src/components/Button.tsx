import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  icon,
  iconPosition = 'left',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-secondary-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-button hover:shadow-button-hover focus:ring-primary-500',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 text-secondary-900 dark:bg-secondary-800 dark:hover:bg-secondary-700 dark:active:bg-secondary-600 dark:text-secondary-100 shadow-button hover:shadow-button-hover focus:ring-secondary-500',
    danger: 'bg-error-600 hover:bg-error-700 active:bg-error-800 text-white shadow-button hover:shadow-button-hover focus:ring-error-500',
    warning: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700 text-warning-900 shadow-button hover:shadow-button-hover focus:ring-warning-500',
    ghost: 'hover:bg-secondary-100 active:bg-secondary-200 text-secondary-700 dark:hover:bg-secondary-800 dark:active:bg-secondary-700 dark:text-secondary-300 focus:ring-secondary-500',
    outline: 'border border-secondary-300 hover:bg-secondary-50 active:bg-secondary-100 text-secondary-700 dark:border-secondary-600 dark:hover:bg-secondary-800 dark:active:bg-secondary-700 dark:text-secondary-300 focus:ring-secondary-500',
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5',
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading && (
        <Loader2 className="animate-spin" size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 18 : size === 'xl' ? 20 : 16} />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};

export default Button;
