'use client';

import React, { useRef, useEffect } from 'react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import DesktopIcons from './DesktopIcons';
import Taskbar from './Taskbar';
import WindowManager from './WindowManager';
import StartMenu from './StartMenu';
import { useState } from 'react';

/**
 * WindowsDesktop - A Windows 2000 style desktop environment
 * Updated to use AppContext
 */
const WindowsDesktop = ({ children }) => {
  const { theme } = useTheme();
  const { 
    openWindows, 
    activeWindow, 
    setActiveWindow,
    openWindow: contextOpenWindow,
    minimizeWindow,
    restoreWindow, 
    closeWindow,
    setDesktopElement
  } = useApp();
  const [showStartMenu, setShowStartMenu] = useState(false);
  const desktopRef = useRef(null);

  // Set up the desktop reference
  useEffect(() => {
    if (desktopRef.current) {
      setDesktopElement(desktopRef.current);
    }
  }, [desktopRef, setDesktopElement]);

  // Handle clicking the Start button
  const handleStartClick = () => {
    setShowStartMenu(!showStartMenu);
  };

  // Handle clicking outside to close the start menu
  const handleOutsideClick = (e) => {
    if (e.target === desktopRef.current) {
      setShowStartMenu(false);
    }
  };

  // Calculate desktop color based on theme
  const getDesktopColor = () => {
    // Use truly transparent background to let the body background show through
    return {
      // Remove ALL background settings to ensure transparency
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  };

  // Safe version of openWindow that checks for duplicates
  const safeOpenWindow = (id, component, title) => {
    // Check if window already exists
    const existingWindow = openWindows.find(w => w.id === id);
    
    if (existingWindow) {
      // If it exists, just focus it instead of creating a new one
      setActiveWindow(id);
      
      if (existingWindow.minimized) {
        restoreWindow(id);
      }
    } else {
      // If it doesn't exist, open a new window
      contextOpenWindow(id, component, title);
    }
  };

  return (
    <div className="flex flex-col h-screen relative" onClick={handleOutsideClick}>
      {/* Desktop area */}
      <div 
        ref={desktopRef}
        className="flex-1 relative overflow-hidden"
        style={{
          ...getDesktopColor(),
          // Explicitly ensure no background properties from CSS classes
          background: 'transparent',
        }}
      >
        {/* Background overlay with theme color and adjustable opacity - only show when opacity > 0 */}
        {(theme.desktopOpacity !== undefined && theme.desktopOpacity > 0) && (
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{
              backgroundColor: `#${theme.bgColor}`,
              opacity: theme.desktopOpacity,
              mixBlendMode: 'multiply'
            }}
          />
        )}
        
        {/* Desktop Icons */}
        <DesktopIcons
          onOpenWindow={safeOpenWindow}
          openWindows={openWindows}
          theme={theme}
        />

        {/* Windows */}
        <WindowManager
          windows={openWindows}
          activeWindow={activeWindow}
          setActiveWindow={setActiveWindow}
          onMinimize={minimizeWindow}
          onClose={closeWindow}
          desktop={desktopRef}
          theme={theme}
        >
          {children}
        </WindowManager>

        {/* Start Menu */}
        {showStartMenu && (
          <StartMenu 
            onClose={() => setShowStartMenu(false)}
            onOpenWindow={safeOpenWindow}
            theme={theme}
          />
        )}
      </div>

      {/* Taskbar */}
      <Taskbar
        windows={openWindows}
        activeWindow={activeWindow}
        onStartClick={handleStartClick}
        startMenuOpen={showStartMenu}
        onWindowClick={(windowId) => {
          const window = openWindows.find(w => w.id === windowId);
          if (window?.minimized) {
            restoreWindow(windowId);
          } else {
            setActiveWindow(windowId);
          }
        }}
        theme={theme}
      />
    </div>
  );
};

export default WindowsDesktop;