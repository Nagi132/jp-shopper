'use client';

import React, { useState, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Palette, Check } from "lucide-react";

// Predefined themes
const THEMES = [
  { 
    name: "Mint & Pink", 
    borderColor: "69EFD7", 
    bgColor: "FED1EB",
    id: "mint-pink"
  },
  { 
    name: "Neon", 
    borderColor: "FE66FE", 
    bgColor: "51F5FF",
    id: "neon"
  },
  { 
    name: "Retrowave", 
    borderColor: "E7F227", 
    bgColor: "293EFE",
    id: "retrowave"
  },
  // Additional themes
  { 
    name: "Bubblegum", 
    borderColor: "FF80D5", 
    bgColor: "D6FDFF",
    id: "bubblegum"
  },
  { 
    name: "Y2K Gold", 
    borderColor: "FFD700", 
    bgColor: "F5F5DC",
    id: "y2k-gold"
  },
  { 
    name: "Pixel Purple", 
    borderColor: "9966FF", 
    bgColor: "E6E6FA",
    id: "pixel-purple"
  }
];

// Background patterns
const BG_PATTERNS = [
  { 
    name: "None", 
    value: "none",
    id: "none"
  },
  { 
    name: "Stars", 
    value: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6H8l5 3-2 6zm30 14l3-2 3 2-1-4 3-2h-4l-1-4-1 4h-4l3 2-1 4zM70 18l5-4 5 4-2-6 5-3h-6l-2-6-2 6h-6l5 3-2 6z' fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
    id: "stars"
  },
  { 
    name: "Dots", 
    value: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
    id: "dots"
  },
  { 
    name: "Grid", 
    value: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z'/%3E%3C/g%3E%3C/svg%3E\")",
    id: "grid"
  },
  { 
    name: "Noise", 
    value: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c4zIgsAAAAIXRSTlP9zMXO1t3G0M/Q0dDN3NHMzMLKzczKzszNzcrSztfJ1mGKzKQAAADFSURBVHjazdVJDoMgFIThQkWZ5zmN93/L3sRo0M5j1bLq37/VV6HQ0/Z9LwA0dVVVNcFQ55zGQvscGHQEGwfUURcKsB1Qt6AecJANqH9RiAMs1skX1BULxAGJ5X5AbUAHWK7TCrUC5WC5Tg4IxAFWdDKoAXVALuohPZfJkxbUQmyci3RARgdYLOoEtZCUw48zvf2C2iMmU1lyify468RmpIkJGJM3OgP18hrVvUB2QB0gHLQEDYAgHAZkB0QGHhAseQGxoTk/+Uz0EgjTNb4AAAAASUVORK5CYII=')",
    id: "noise"
  }
];

/**
 * ThemeCustomizer - A component that allows users to customize the Y2K theme
 * 
 * @param {Object} props
 * @param {Function} props.onThemeChange - Callback when theme changes
 */
const ThemeCustomizer = ({ onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(THEMES[0]);
  const [currentPattern, setCurrentPattern] = useState(BG_PATTERNS[0]);
  
  // Load saved theme on component mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        const matchedTheme = THEMES.find(t => 
          t.borderColor === theme.borderColor && 
          t.bgColor === theme.bgColor
        ) || THEMES[0];
        
        const matchedPattern = BG_PATTERNS.find(p => 
          p.value === theme.pattern
        ) || BG_PATTERNS[0];
        
        setCurrentTheme(matchedTheme);
        setCurrentPattern(matchedPattern);
        
        // Update body background if pattern exists
        if (theme.pattern && theme.pattern !== 'none') {
          document.body.style.backgroundImage = theme.pattern;
        }
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  }, []);

  // Apply theme changes
  const applyTheme = (theme, pattern) => {
    // Save to state
    setCurrentTheme(theme);
    setCurrentPattern(pattern);
    
    // Apply background pattern if needed
    if (pattern.value !== 'none') {
      document.body.style.backgroundImage = pattern.value;
    } else {
      document.body.style.backgroundImage = '';
    }
    
    // Create theme object
    const themeObject = {
      borderColor: theme.borderColor,
      bgColor: theme.bgColor,
      pattern: pattern.value
    };
    
    // Save to localStorage
    localStorage.setItem('y2kTheme', JSON.stringify(themeObject));
    
    // Trigger callback
    if (onThemeChange) {
      onThemeChange(themeObject);
    }
  };

  // Theme selector component
  const ColorSwatch = ({ theme, isSelected, onClick }) => (
    <div 
      className="flex items-center mb-2 cursor-pointer"
      onClick={() => onClick(theme)}
    >
      <div className="w-4 h-4 mr-2 rounded-full flex items-center justify-center"
           style={{ backgroundColor: isSelected ? '#000' : 'transparent' }}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 flex items-center">
        <div 
          className="w-6 h-6 mr-2 border border-gray-300"
          style={{ backgroundColor: `#${theme.borderColor}` }}
        />
        <div 
          className="w-6 h-6 mr-2 border border-gray-300"
          style={{ backgroundColor: `#${theme.bgColor}` }}
        />
        <span className="text-xs">{theme.name}</span>
      </div>
    </div>
  );

  // Pattern selector component
  const PatternSwatch = ({ pattern, isSelected, onClick }) => (
    <div 
      className="flex items-center mb-2 cursor-pointer"
      onClick={() => onClick(pattern)}
    >
      <div className="w-4 h-4 mr-2 rounded-full flex items-center justify-center"
           style={{ backgroundColor: isSelected ? '#000' : 'transparent' }}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 flex items-center">
        <div 
          className="w-6 h-6 mr-2 border border-gray-300"
          style={{ backgroundImage: pattern.value }}
        />
        <span className="text-xs">{pattern.name}</span>
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button 
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-gray-400 hover:border-gray-600 focus:outline-none" 
          title="Customize Theme"
        >
          <Palette className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3 shadow-[5px_5px_0px_rgba(0,0,0,0.2)] border-2 border-black"
        style={{
          backgroundColor: `#${currentTheme.bgColor}`,
          borderColor: `#${currentTheme.borderColor}`
        }}
      >
        <div className="mb-3 border-b border-gray-300 pb-2">
          <h3 className="font-bold text-sm">Customize Y2K Theme</h3>
        </div>
        
        {/* Color Themes */}
        <div className="mb-4">
          <h4 className="font-bold text-xs mb-2">Color Schemes</h4>
          {THEMES.map(theme => (
            <ColorSwatch 
              key={theme.id}
              theme={theme}
              isSelected={currentTheme.id === theme.id}
              onClick={(theme) => applyTheme(theme, currentPattern)}
            />
          ))}
        </div>
        
        {/* Background Patterns */}
        <div className="mb-2">
          <h4 className="font-bold text-xs mb-2">Background Patterns</h4>
          {BG_PATTERNS.map(pattern => (
            <PatternSwatch 
              key={pattern.id}
              pattern={pattern}
              isSelected={currentPattern.id === pattern.id}
              onClick={(pattern) => applyTheme(currentTheme, pattern)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeCustomizer;