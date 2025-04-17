'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, CircleSlash, Sparkles, Grid, X } from 'lucide-react';

/**
 * FloatingThemeCustomizer - A draggable color palette that starts as an icon
 * Fixed to prevent opening after drag
 * 
 * @param {Object} props
 * @param {Function} props.onThemeChange - Callback when theme changes
 */
const FloatingThemeCustomizer = ({ onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('colors'); // 'colors' or 'patterns'
  const [currentTheme, setCurrentTheme] = useState({
    borderColor: '69EFD7',
    bgColor: 'FED1EB',
    pattern: 'none',
    name: 'Mint & Pink'
  });
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const customizerId = "theme-customizer";
  const customizerRef = useRef(null);
  
  // Track if we've moved during this drag operation
  const hasMoved = useRef(false);
  // Track where the drag started
  const dragStartPos = useRef({ x: 0, y: 0 });
  
  // Predefined themes - Y2K-appropriate names
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

  // Background patterns
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
      icon: <Grid size={16} />
    }
  ];

  // Load saved theme and position on component mount
  useEffect(() => {
    try {
      // Load theme
      const savedTheme = localStorage.getItem('y2kTheme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        setCurrentTheme(theme);
      }
      
      // Load position
      const savedPosition = localStorage.getItem('themeCustomizerPosition');
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      } else {
        // Default to bottom right
        setPosition({ 
          x: window.innerWidth - 80, 
          y: window.innerHeight - 80 
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, []);

  // Handle dragging start for both open and closed states
  const handleMouseDown = (e) => {
    // Dragging is allowed on title bar when open, or the entire button when closed
    if ((isOpen && e.target.closest('.customizer-drag-handle')) || 
        (!isOpen && e.target.closest('#theme-customizer-button'))) {
      e.preventDefault();
      e.stopPropagation();
      
      // Record drag start position
      dragStartPos.current = {
        x: e.clientX,
        y: e.clientY
      };
      
      // Reset movement flag
      hasMoved.current = false;
      
      setIsDragging(true);
      
      const rect = customizerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  
  // Handle dragging for both states
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        // Calculate distance moved since drag start
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        
        // If moved more than 5px in any direction, consider it a drag
        if (dx > 5 || dy > 5) {
          hasMoved.current = true;
        }
        
        // Calculate boundaries based on state - open panel is larger
        const width = isOpen ? 220 : 48; 
        const height = isOpen ? 200 : 48;
        
        const newX = Math.max(0, Math.min(window.innerWidth - width, e.clientX - dragOffset.x));
        const newY = Math.max(0, Math.min(window.innerHeight - height, e.clientY - dragOffset.y));
        
        setPosition({ x: newX, y: newY });
      }
    };
    
    const handleMouseUp = (e) => {
      if (isDragging) {
        // If this was a click (no significant movement), toggle open/closed
        if (!hasMoved.current && !isOpen) {
          setIsOpen(true);
        }
        
        setIsDragging(false);
        
        // Save position
        localStorage.setItem('themeCustomizerPosition', JSON.stringify(position));
      }
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, position, isOpen]);

  // Apply theme changes
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

  return (
    <div 
      ref={customizerRef}
      id={customizerId}
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {/* Icon only when closed */}
      {!isOpen && (
        <button 
          id="theme-customizer-button"
          className="w-12 h-12 flex items-center justify-center rounded-full shadow-[3px_3px_0px_rgba(0,0,0,0.3)] cursor-win-move"
          style={{
            backgroundColor: `#${currentTheme.bgColor}`,
            borderWidth: '2px',
            borderStyle: 'solid', 
            borderColor: `#${currentTheme.borderColor}`,
          }}
          onMouseDown={handleMouseDown}
          title="Theme Customizer"
        >
          <Palette size={24} />
        </button>
      )}
      
      {/* Expanded panel when open */}
      {isOpen && (
        <div 
          className="shadow-[3px_3px_0px_rgba(0,0,0,0.3)] rounded-md overflow-hidden win2k-window"
          style={{
            backgroundColor: `#${currentTheme.bgColor}`,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: `#${currentTheme.borderColor}`,
            width: '220px'
          }}
        >
          {/* Titlebar - draggable */}
          <div 
            className="h-7 flex items-center justify-between px-2 customizer-drag-handle cursor-win-move"
            style={{
              backgroundColor: `#${currentTheme.borderColor}`,
              color: '#FFFFFF',
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center">
              <Palette size={14} className="mr-1" />
              <span className="text-xs font-bold">Theme Customizer</span>
            </div>
            <button 
              className="w-4 h-4 flex items-center justify-center bg-gray-200 border border-gray-400 hover:bg-red-200"
              onClick={() => setIsOpen(false)}
            >
              <X size={10} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: `#${currentTheme.borderColor}40` }}>
            <button
              className={`px-3 py-1 text-xs ${activeTab === 'colors' ? 'bg-white bg-opacity-30 font-bold' : 'hover:bg-white hover:bg-opacity-20'}`}
              onClick={() => setActiveTab('colors')}
            >
              Colors
            </button>
            <button
              className={`px-3 py-1 text-xs ${activeTab === 'patterns' ? 'bg-white bg-opacity-30 font-bold' : 'hover:bg-white hover:bg-opacity-20'}`}
              onClick={() => setActiveTab('patterns')}
            >
              Patterns
            </button>
          </div>
          
          {/* Content */}
          <div className="p-3">
            {activeTab === 'colors' ? (
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.name}
                    className={`w-full h-12 rounded flex flex-col items-center justify-center transition-transform hover:scale-105 border-2 ${
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
                      <Check className="text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" size={14} />
                    )}
                    <span className="text-xs text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {BG_PATTERNS.map((pattern) => (
                  <button
                    key={pattern.name}
                    className={`h-12 rounded border-2 flex flex-col items-center justify-center ${
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
                    <span className="text-xs mt-1">
                      {pattern.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingThemeCustomizer;