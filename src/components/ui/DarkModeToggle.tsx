import React, { useState, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useDarkMode, usePrefersReducedMotion } from '../../contexts/DarkModeContext';

interface DarkModeToggleProps {
  variant?: 'simple' | 'detailed' | 'dropdown';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  variant = 'simple',
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const { isDarkMode, toggleDarkMode, mode, setMode } = useDarkMode();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleToggle = () => {
    if (!prefersReducedMotion) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    toggleDarkMode();
  };

  const handleModeSelect = (newMode: 'light' | 'dark' | 'system') => {
    if (!prefersReducedMotion) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    setMode(newMode);
    setIsDropdownOpen(false);
  };

  // Simple toggle variant
  if (variant === 'simple') {
    return (
      <button
        onClick={handleToggle}
        className={`
          relative ${sizeClasses[size]} 
          bg-gray-200 dark:bg-gray-700 
          hover:bg-gray-300 dark:hover:bg-gray-600
          rounded-full transition-all duration-300
          flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${isAnimating && !prefersReducedMotion ? 'animate-pulse' : ''}
          ${className}
        `}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Sun 
            className={`
              ${iconSizes[size]} absolute
              text-yellow-500
              transition-all duration-300
              ${isDarkMode ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
            `}
          />
          <Moon 
            className={`
              ${iconSizes[size]} absolute
              text-blue-400
              transition-all duration-300
              ${isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}
            `}
          />
        </div>
      </button>
    );
  }

  // Detailed toggle variant (with sliding animation)
  if (variant === 'detailed') {
    return (
      <button
        onClick={handleToggle}
        className={`
          relative inline-flex items-center
          ${size === 'sm' ? 'h-6 w-11' : size === 'lg' ? 'h-8 w-16' : 'h-7 w-14'}
          flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent
          bg-gray-200 dark:bg-gray-700
          transition-colors duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${className}
        `}
        role="switch"
        aria-checked={isDarkMode}
        aria-label="Toggle dark mode"
      >
        <span className="sr-only">Toggle dark mode</span>
        <span
          className={`
            ${size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-7 w-7' : 'h-6 w-6'}
            pointer-events-none inline-block rounded-full
            bg-white dark:bg-gray-900
            shadow-lg ring-0
            transition-all duration-300 ease-in-out
            ${isDarkMode 
              ? size === 'sm' ? 'translate-x-5' : size === 'lg' ? 'translate-x-8' : 'translate-x-7'
              : 'translate-x-0'
            }
            flex items-center justify-center
          `}
        >
          <Sun 
            className={`
              ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'}
              text-yellow-500
              transition-all duration-300
              ${isDarkMode ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
            `}
          />
          <Moon 
            className={`
              ${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'}
              absolute text-blue-400
              transition-all duration-300
              ${isDarkMode ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
            `}
          />
        </span>
      </button>
    );
  }

  // Dropdown variant (with system option)
  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`
          flex items-center gap-2 px-3 py-2
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          rounded-lg transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${className}
        `}
        aria-label="Theme selector"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        {mode === 'light' && <Sun className={iconSizes[size]} />}
        {mode === 'dark' && <Moon className={iconSizes[size]} />}
        {mode === 'system' && <Monitor className={iconSizes[size]} />}
        {showLabel && (
          <span className="text-sm font-medium capitalize">
            {mode === 'system' ? 'Auto' : mode}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
            aria-hidden="true"
          />
          <div className={`
            absolute right-0 mt-2 w-36 z-20
            bg-white dark:bg-gray-800
            rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700
            py-1
            ${!prefersReducedMotion ? 'animate-fade-in-down' : ''}
          `}>
            <button
              onClick={() => handleModeSelect('light')}
              className={`
                w-full px-3 py-2 text-left text-sm
                hover:bg-gray-100 dark:hover:bg-gray-700
                flex items-center gap-2
                transition-colors duration-150
                ${mode === 'light' ? 'text-blue-600 dark:text-blue-400' : ''}
              `}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
              {mode === 'light' && <Check className="w-4 h-4 ml-auto" />}
            </button>
            
            <button
              onClick={() => handleModeSelect('dark')}
              className={`
                w-full px-3 py-2 text-left text-sm
                hover:bg-gray-100 dark:hover:bg-gray-700
                flex items-center gap-2
                transition-colors duration-150
                ${mode === 'dark' ? 'text-blue-600 dark:text-blue-400' : ''}
              `}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
              {mode === 'dark' && <Check className="w-4 h-4 ml-auto" />}
            </button>
            
            <button
              onClick={() => handleModeSelect('system')}
              className={`
                w-full px-3 py-2 text-left text-sm
                hover:bg-gray-100 dark:hover:bg-gray-700
                flex items-center gap-2
                transition-colors duration-150
                ${mode === 'system' ? 'text-blue-600 dark:text-blue-400' : ''}
              `}
            >
              <Monitor className="w-4 h-4" />
              <span>System</span>
              {mode === 'system' && <Check className="w-4 h-4 ml-auto" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
};