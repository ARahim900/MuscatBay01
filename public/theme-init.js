// Theme initialization script to prevent FOUC (Flash of Unstyled Content)
// This runs before React loads to set the correct theme immediately

(function() {
  'use strict';
  
  // Get stored theme preference or default to system
  const storageKey = 'mbbay-theme';
  const savedMode = localStorage.getItem(storageKey);
  
  // Function to get system preference
  function getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  // Determine the actual theme to apply
  let theme = 'light';
  
  if (savedMode === 'dark') {
    theme = 'dark';
  } else if (savedMode === 'light') {
    theme = 'light';
  } else if (!savedMode || savedMode === 'system') {
    theme = getSystemPreference();
  }
  
  // Apply theme to html element
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#0a0a0b');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#0a0a0b';
      document.head.appendChild(meta);
    }
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#ffffff');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#ffffff';
      document.head.appendChild(meta);
    }
  }
  
  // Add no-transition class to prevent transition on initial load
  root.classList.add('no-transition');
  
  // Remove no-transition class after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        root.classList.remove('no-transition');
      }, 0);
    });
  } else {
    setTimeout(function() {
      root.classList.remove('no-transition');
    }, 0);
  }
})();