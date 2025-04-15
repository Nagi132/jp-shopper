'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, CircleSlash, Sparkles, GridIcon, X } from 'lucide-react';

/**
 * FloatingThemeCustomizer - An always-visible theme selector in the bottom right
 * 
 * @param {Object} props
 * @param {Function} props.onThemeChange - Callback when theme changes
 */
const FloatingThemeCustomizer = ({ onThemeChange }) => {
  const [activeTab, setActiveTab] = useState('colors'); // 'colors' or 'patterns'
  const [currentTheme, setCurrentTheme] = useState({
    borderColor: '69EFD7',
    bgColor: 'FED1EB',
    pattern: 'none',
    name: 'Mint & Pink'
  });
  
  // Predefined themes - enhanced with more Y2K-appropriate names
  const THEMES = [
    { 
      name: "Mint & Pink", 
      borderColor: "69EFD7", 
      bgColor: "FED1EB",
      textColor: "000000"
    },
    { 
      name: "Cyber Neon", 
      borderColor: "FE66FE", 
      bgColor: "51F5FF",
      textColor: "000000"
    },
    { 
      name: "Vaporwave", 
      borderColor: "E7F227", 
      bgColor: "293EFE",
      textColor: "FFFFFF"
    },
    { 
      name: "Kawaii", 
      borderColor: "FF80D5", 
      bgColor: "D6FDFF",
      textColor: "000000"
    },
    { 
      name: "Millennium", 
      borderColor: "FFD700", 
      bgColor: "F5F5DC",
      textColor: "000000"
    },
    { 
      name: "Pixel Pop", 
      borderColor: "9966FF", 
      bgColor: "E6E6FA",
      textColor: "000000"
    }
  ];

  // Background patterns with icons
  const BG_PATTERNS = [
    { 
      name: "None", 
      value: "none",
      icon: <CircleSlash size={16} />
    },
    { 
      name: "Stars", 
      value: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6H8l5 3-2 6zm30 14l3-2 3 2-1-4 3-2h-4l-1-4-1 4h-4l3 2-1 4zM70 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6h-6l5 3-2 6z' fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
      icon: <Sparkles size={16} />
    },
    { 
      name: "Dots", 
      value: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-current"></div>
              <div className="w-1 h-1 rounded-full bg-current"></div>
            </div>
    },
    { 
      name: "Grid", 
      value: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z'/%3E%3C/g%3E%3C/svg%3E\")",
      icon: <GridIcon size={16} />
    },
    { 
      name: "Noise", 
      value: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c4zIgsAAAAIXRSTlP9zMXO1t3G0M/Q0dDN3NHMzMLKzczKzszNzcrSztfJ1mGKzKQAAADFSURBVHjazdVJDoMgFIThQkWZ5zmN93/L3sRo0M5j1bLq37/VV6HQ0/Z9LwA0dVVVNcFQ55zGQvscGHQEGwfUURcKsB1Qt6AecJANqH9RiAMs1skX1BULxAGJ5X5AbUAHWK7TCrUC5WC5Tg4IxAFWdDKoAXVALuohPZfJkxbUQmyci3RARgdYLOoEtZCUw48zvf2C2iMmU1lyify468RmpIkJGJM3OgP18hrVvUB2QB0gHLQEDYAgHAZkB0QGHhAseQGxoTk/+Uz0EgjTNb4AAAAASUVORK5CYII=')",
      icon: <div className="w-4 h-4 bg-current opacity-50"></div>
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

  // Find current pattern object
  const currentPatternObj = BG_PATTERNS.find(p => p.value === currentTheme.pattern) || BG_PATTERNS[0];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Always visible palette bar */}
      <div 
        className="flex items-center p-1 rounded-lg shadow-[3px_3px_0_rgba(0,0,0,0.3)]"
        style={{
          backgroundColor: `#${currentTheme.bgColor}`,
          borderWidth: '2px',
          borderStyle: 'solid', 
          borderColor: `#${currentTheme.borderColor}`,
          color: `#${currentTheme.textColor || '000000'}`
        }}
      >
        {/* Palette Icon */}
        <div className="px-2 flex items-center">
          <Palette size={18} className="mr-2" />
          <span className="text-xs font-bold">Theme</span>
        </div>
        
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('colors')}
            className={`px-3 py-1 text-xs rounded-tl-md rounded-bl-md ${
              activeTab === 'colors' 
              ? 'bg-white bg-opacity-30 font-bold'
              : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Colors
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-3 py-1 text-xs rounded-tr-md rounded-br-md ${
              activeTab === 'patterns' 
              ? 'bg-white bg-opacity-30 font-bold'
              : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            Pattern
          </button>
        </div>
        
        {/* Current pattern indicator */}
        <div className="ml-2 p-1 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
          {currentPatternObj.icon}
        </div>
      </div>
      
      {/* Contents based on active tab */}
      <div 
        className="mt-1 p-2 rounded-md shadow-[3px_3px_0_rgba(0,0,0,0.3)]"
        style={{
          backgroundColor: `#${currentTheme.bgColor}`,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: `#${currentTheme.borderColor}`,
          color: `#${currentTheme.textColor || '000000'}`
        }}
      >
        {activeTab === 'colors' ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {THEMES.map((theme) => (
              <button
                key={theme.name}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-transform hover:scale-110 ${
                  currentTheme.name === theme.name ? 'border-white' : 'border-transparent'
                }`}
                style={{ 
                  background: `linear-gradient(45deg, #${theme.borderColor}, #${theme.bgColor})`,
                  boxShadow: currentTheme.name === theme.name ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none'
                }}
                onClick={() => applyTheme(theme)}
                title={theme.name}
              >
                {currentTheme.name === theme.name && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {BG_PATTERNS.map((pattern) => (
              <button
                key={pattern.name}
                className={`w-12 h-12 rounded-md border-2 flex items-center justify-center ${
                  currentTheme.pattern === pattern.value 
                    ? 'border-white' 
                    : 'border-transparent hover:border-white hover:border-opacity-50'
                }`}
                style={{ 
                  backgroundImage: pattern.value !== 'none' ? pattern.value : 'none',
                  backgroundColor: pattern.value === 'none' ? '#ffffff60' : 'rgba(255,255,255,0.5)'
                }}
                onClick={() => applyPattern(pattern.value)}
                title={pattern.name}
              >
                <div className="bg-white bg-opacity-70 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                  {pattern.icon}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingThemeCustomizer;