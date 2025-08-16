import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  headerAction,
  variant = 'default',
  padding = 'md'
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-200';

  const variantClasses = {
    default: 'bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 shadow-soft',
    elevated: 'bg-white dark:bg-secondary-900 shadow-large border border-secondary-100 dark:border-secondary-800',
    outlined: 'bg-white dark:bg-secondary-900 border-2 border-secondary-200 dark:border-secondary-700',
    glass: 'glass border border-secondary-200 dark:border-secondary-700',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const headerPaddingClasses = {
    none: '',
    sm: 'px-4 py-3',
    md: 'px-6 py-4',
    lg: 'px-8 py-5',
  };

  const contentPaddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${padding !== 'none' && !title ? paddingClasses[padding] : ''} ${className}`}>
      {title && (
        <div className={`border-b border-secondary-200 dark:border-secondary-700 ${headerPaddingClasses[padding]}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={title ? contentPaddingClasses[padding] : ''}>
        {children}
      </div>
    </div>
  );
};

export default Card;
