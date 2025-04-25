'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the Theme Context with default values
export const ThemeContext = createContext({
  theme: {
    borderColor: '69EFD7',
    bgColor: 'FED1EB',
    titleBarColor: '000080',
    titleTextColor: 'FFFFFF',
    buttonBgColor: 'ECECEC',
    pattern: 'none'
  },
  setTheme: () => {}
});

/**
 * ThemeProvider - Global theme context provider
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    borderColor: '69EFD7',
    bgColor: 'FED1EB',
    titleBarColor: '000080',
    titleTextColor: 'FFFFFF',
    buttonBgColor: 'ECECEC',
    pattern: 'none',
    mouseIcon: 'bag',
    desktopOpacity: 0 // Set to 0 (no tint) by default
  });

  // Apply the theme to the body element when the theme changes
  useEffect(() => {
    applyThemeToBody(theme);
  }, [theme]);

  // Load saved theme on component mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        
        // Handle backward compatibility
        const completeTheme = {
          ...theme, // Default values
          ...parsedTheme, // Saved values
          // Ensure mouseIcon exists (for backward compatibility)
          mouseIcon: parsedTheme.mouseIcon || 'bag'
        };
        
        setTheme(completeTheme);
        applyThemeToBody(completeTheme);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
    
    // Listen for theme change events
    const handleThemeChange = (e) => {
      setTheme(e.detail);
    };
    window.addEventListener('themeChange', handleThemeChange);
    
    // Listen for storage events (for multi-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === 'y2kTheme') {
        try {
          const newTheme = JSON.parse(e.newValue);
          setTheme(newTheme);
        } catch (error) {
          console.error("Error handling storage change:", error);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Apply theme data to body element
  const applyThemeToBody = (themeData) => {
    if (!themeData) return;
    
    try {
      // Set background color for body
      document.body.style.backgroundColor = `#${themeData.bgColor}`;
      
      // Reset background properties
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundSize = 'auto';
      document.body.style.backgroundRepeat = 'repeat';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundBlendMode = 'normal';
      
      // Apply pattern if exists and not 'none'
      if (themeData.pattern && themeData.pattern !== 'none') {
        // Check what type of pattern it is
        
        // Case 1: CSS URL patterns (data:image or SVG)
        if (themeData.pattern.startsWith('url(')) {
          document.body.style.backgroundImage = themeData.pattern;
          document.body.style.backgroundRepeat = 'repeat';
          document.body.style.backgroundSize = 'auto';
          // Use normal blend mode if opacity is 0, otherwise use soft-light
          document.body.style.backgroundBlendMode = (!themeData.desktopOpacity || themeData.desktopOpacity === 0) ? 'normal' : 'soft-light';
        }
        // Case 2: Files from public folder (desktop backgrounds)
        else if (themeData.pattern.startsWith('/desktop/')) {
          document.body.style.backgroundImage = `url(${themeData.pattern})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center center';
          document.body.style.backgroundRepeat = 'no-repeat';
          
          // Set blend mode based on opacity first, then file type
          if (!themeData.desktopOpacity || themeData.desktopOpacity === 0) {
            // When opacity is 0, always use normal blend mode
            document.body.style.backgroundBlendMode = 'normal';
          } 
          // For GIFs, we don't want blend mode to mute the animation
          else if (themeData.pattern.endsWith('.gif')) {
            document.body.style.backgroundBlendMode = 'normal';
          } else {
            document.body.style.backgroundBlendMode = 'soft-light';
          }
        }
        // Case 3: Custom uploaded images (data URLs)
        else if (themeData.pattern.startsWith('data:image/')) {
          document.body.style.backgroundImage = `url(${themeData.pattern})`;
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundPosition = 'center center';
          document.body.style.backgroundRepeat = 'no-repeat';
          // Use normal blend mode if opacity is 0, otherwise use soft-light
          document.body.style.backgroundBlendMode = (!themeData.desktopOpacity || themeData.desktopOpacity === 0) ? 'normal' : 'soft-light';
        }
      }
    } catch (error) {
      console.error("Error applying theme to body:", error);
    }
  };

  // Handle theme changes
  const handleThemeChange = (newTheme) => {
    setTheme(currentTheme => {
      const updatedTheme = { ...currentTheme, ...newTheme };
      
      // Save to localStorage
      localStorage.setItem('y2kTheme', JSON.stringify(updatedTheme));
      
      return updatedTheme;
    });
  };

  // Provide the theme context to children
  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;