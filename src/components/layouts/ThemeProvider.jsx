'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import FloatingThemeCustomizer from '@/components/ui/FloatingThemeCustomizer';

// Create a context for the theme
export const ThemeContext = createContext({
  theme: { borderColor: '69EFD7', bgColor: 'FED1EB', pattern: 'none' },
  setTheme: () => {},
});

/**
 * A provider component that manages the global theme state
 * and makes it available to all components
 */
export function ThemeProvider({ children }) {
  // Default theme
  const [theme, setTheme] = useState({
    borderColor: '69EFD7',
    bgColor: 'FED1EB',
    pattern: 'none',
    name: 'Mint & Pink'
  });

  // Load theme from localStorage on component mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme(parsedTheme);
        
        // Apply background pattern and color to the body
        applyThemeToBody(parsedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }, []);

  // Apply theme to body element
  const applyThemeToBody = (themeData) => {
    // Apply background pattern if it exists
    if (themeData.pattern && themeData.pattern !== 'none') {
      document.body.style.backgroundImage = themeData.pattern;
      document.body.style.backgroundColor = `#${themeData.bgColor}30`; // Semi-transparent background color
    } else {
      document.body.style.backgroundImage = `linear-gradient(135deg, #${themeData.bgColor}40, #${themeData.borderColor}20)`;
      document.body.style.backgroundColor = 'transparent';
    }
  };

  // Handle theme changes from the customizer
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyThemeToBody(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
      <FloatingThemeCustomizer onThemeChange={handleThemeChange} />
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;