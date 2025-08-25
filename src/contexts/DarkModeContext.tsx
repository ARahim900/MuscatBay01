import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Types
interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  systemPreference: 'light' | 'dark' | null;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
}

interface DarkModeProviderProps {
  children: React.ReactNode;
  defaultMode?: 'light' | 'dark' | 'system';
  storageKey?: string;
}

// Create context
const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

// Custom hook to use dark mode
export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Provider component
export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({
  children,
  defaultMode = 'system',
  storageKey = 'theme-preference'
}) => {
  const [mode, setModeState] = useState<'light' | 'dark' | 'system'>(defaultMode);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark' | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange as any);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange as any);
      }
    };
  }, []);

  // Load saved preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem(storageKey) as 'light' | 'dark' | 'system' | null;
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setModeState(savedMode);
    }
  }, [storageKey]);

  // Update dark mode state based on mode and system preference
  useEffect(() => {
    let isDark = false;
    
    if (mode === 'dark') {
      isDark = true;
    } else if (mode === 'light') {
      isDark = false;
    } else if (mode === 'system') {
      isDark = systemPreference === 'dark';
    }

    setIsDarkMode(isDark);

    // Update document classes
    const root = document.documentElement;
    
    // Add transition class for smooth switching
    root.classList.add('theme-transition');
    
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#0a0a0b');
      }
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      
      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff');
      }
    }

    // Remove transition class after animation
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
  }, [mode, systemPreference]);

  // Save mode preference to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, mode);
  }, [mode, storageKey]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setModeState(prevMode => {
      if (prevMode === 'system') {
        return isDarkMode ? 'light' : 'dark';
      }
      return prevMode === 'dark' ? 'light' : 'dark';
    });
  }, [isDarkMode]);

  // Set dark mode directly
  const setDarkMode = useCallback((value: boolean) => {
    setModeState(value ? 'dark' : 'light');
  }, []);

  // Set mode
  const setMode = useCallback((newMode: 'light' | 'dark' | 'system') => {
    setModeState(newMode);
  }, []);

  const value: DarkModeContextType = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    systemPreference,
    mode,
    setMode
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Utility hook for checking if we should use reduced motion
export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(e.matches);
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange as any);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange as any);
      }
    };
  }, []);

  return prefersReducedMotion;
};