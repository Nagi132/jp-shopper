'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, X } from 'lucide-react';

/**
 * FloatingThemeCustomizer - A floating theme selector in the bottom right
 * 
 * @param {Object} props
 * @param {Function} props.onThemeChange - Callback when theme changes
 */
const FloatingThemeCustomizer = ({ onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState({
    borderColor: '69EFD7',
    bgColor: 'FED1EB',
    pattern: 'none',
    name: 'Mint & Pink'
  });
  
  // Predefined themes
  const THEMES = [
    { 
      name: "Mint & Pink", 
      borderColor: "69EFD7", 
      bgColor: "FED1EB",
      textColor: "000000"
    },
    { 
      name: "Neon", 
      borderColor: "FE66FE", 
      bgColor: "51F5FF",
      textColor: "000000"
    },
    { 
      name: "Retrowave", 
      borderColor: "E7F227", 
      bgColor: "293EFE",
      textColor: "FFFFFF"
    },
    { 
      name: "Bubblegum", 
      borderColor: "FF80D5", 
      bgColor: "D6FDFF",
      textColor: "000000"
    },
    { 
      name: "Y2K Gold", 
      borderColor: "FFD700", 
      bgColor: "F5F5DC",
      textColor: "000000"
    },
    { 
      name: "Pixel Purple", 
      borderColor: "9966FF", 
      bgColor: "E6E6FA",
      textColor: "000000"
    }
  ];

  // Background patterns
  const BG_PATTERNS = [
    { 
      name: "None", 
      value: "none"
    },
    { 
      name: "Stars", 
      value: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6H8l5 3-2 6zm30 14l3-2 3 2-1-4 3-2h-4l-1-4-1 4h-4l3 2-1 4zM70 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6h-6l5 3-2 6z' fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")"
    },
    { 
      name: "Dots", 
      value: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E\")"
    },
    { 
      name: "Grid", 
      value: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z'/%3E%3C/g%3E%3C/svg%3E\")"
    },
    { 
      name: "Noise", 
      value: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c4zIgsAAAAIXRSTlP9zMXO1t3G0M/Q0dDN3NHMzMLKzczKzszNzcrSztfJ1mGKzKQAAADFSURBVHjazdVJDoMgFIThQkWZ5zmN93/L3sRo0M5j1bLq37/VV6HQ0/Z9LwA0dVVVNcFQ55zGQvscGHQEGwfUURcKsB1Qt6AecJANqH9RiAMs1skX1BULxAGJ5X5AbUAHWK7TCrUC5WC5Tg4IxAFWdDKoAXVALuohPZfJkxbUQmyci3RARgdYLOoEtZCUw48zvf2C2iMmU1lyify468RmpIkJGJM3OgP18hrVvUB2QB0gHLQEDYAgHAZkB0QGHhAseQGxoTk/+Uz0EgjTNb4AAAAASUVORK5CYII=')"
    }
  ];

  // Load saved theme on component mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        
        // Find matching predefined theme or fallback to first theme
        const matchedTheme = THEMES.find(t => 
          t.borderColor === theme.borderColor && 
          t.bgColor === theme.bgColor
        );
        
        if (matchedTheme) {
          setCurrentTheme({
            ...matchedTheme,
            pattern: theme.pattern || 'none',
          });
        }
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  }, []);

  // Apply theme
  const applyTheme = (theme, pattern = currentTheme.pattern) => {
    // Create full theme object
    const fullTheme = {
      ...theme,
      pattern: pattern
    };
    
    // Save to localStorage
    localStorage.setItem('y2kTheme', JSON.stringify(fullTheme));
    
    // Update current theme
    setCurrentTheme(fullTheme);
    
    // Notify parent component
    if (onThemeChange) {
      onThemeChange(fullTheme);
    }
  };

  // Apply pattern
  const applyPattern = (pattern) => {
    applyTheme(currentTheme, pattern);
  };

  // Toggle the customizer visibility
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Theme Panel */}
      {isOpen && (
        <div 
          className="absolute bottom-12 right-0 mb-2 p-3 rounded shadow-lg w-64"
          style={{
            backgroundColor: `#${currentTheme.bgColor}`,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: `#${currentTheme.borderColor}`,
            boxShadow: '3px 3px 0 rgba(0,0,0,0.2)',
            color: `#${currentTheme.textColor || '000000'}`
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Theme Customizer</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium mb-1">Color Schemes</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  className="flex flex-col items-center p-1 border rounded hover:bg-white hover:bg-opacity-20"
                  style={{ borderColor: `#${theme.borderColor}` }}
                  onClick={() => applyTheme(theme)}
                >
                  <div 
                    className="w-full h-6 mb-1 rounded relative" 
                    style={{ backgroundColor: `#${theme.bgColor}` }}
                  >
                    <div className="absolute inset-0 border-t-2" style={{ borderColor: `#${theme.borderColor}` }}></div>
                    {currentTheme.name === theme.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs truncate" style={{ color: `#${theme.textColor || '000000'}` }}>
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-medium mb-1">Background Pattern</p>
            <div className="grid grid-cols-2 gap-2">
              {BG_PATTERNS.map((pattern) => (
                <button
                  key={pattern.name}
                  className="flex flex-col items-center p-1 border rounded hover:bg-white hover:bg-opacity-20"
                  style={{ borderColor: `#${currentTheme.borderColor}` }}
                  onClick={() => applyPattern(pattern.value)}
                >
                  <div 
                    className="w-full h-6 mb-1 rounded relative" 
                    style={{ 
                      backgroundImage: pattern.value !== 'none' ? pattern.value : 'none',
                      backgroundColor: pattern.value === 'none' ? '#ffffff' : 'transparent'
                    }}
                  >
                    {currentTheme.pattern === pattern.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs truncate">
                    {pattern.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Toggle Button */}
      <button
        onClick={toggleOpen}
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
        style={{
          backgroundColor: `#${currentTheme.bgColor}`,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: `#${currentTheme.borderColor}`,
          color: `#${currentTheme.textColor || '000000'}`
        }}
      >
        <Palette size={18} />
      </button>
    </div>
  );
};

export default FloatingThemeCustomizer;