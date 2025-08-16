import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-1 flex items-center justify-center`}>
        <img
          src={"../assets/logo.png"}
          alt="Recursor Logo"
          className={`${sizeClasses[size]} object-contain`}
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>
      {showText && (
        <span
          className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]}`}
        >
          Recursor
        </span>
      )}
    </div>
  );
};

export default Logo;
