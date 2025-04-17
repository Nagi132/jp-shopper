'use client';

import React, { useRef } from 'react';
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
    openWindow,
    minimizeWindow,
    restoreWindow, 
    closeWindow 
  } = useApp();
  const [showStartMenu, setShowStartMenu] = useState(false);
  const desktopRef = useRef(null);

  // Handle clicking the Start button
  const handleStartClick = () => {
    setShowStartMenu(!showStartMenu);
  };

  // Handle clicking outside to close the start menu
  const handleOutsideClick = (e) => {
    if (showStartMenu && !e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
      setShowStartMenu(false);
    }
  };

  // Calculate desktop color based on theme
  const getDesktopColor = () => {
    return {
      backgroundImage: `linear-gradient(135deg, #${theme.bgColor}40, #${theme.borderColor}20)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  };

  return (
    <div className="flex flex-col h-screen relative" onClick={handleOutsideClick}>
      {/* Desktop area */}
      <div 
        ref={desktopRef}
        className="flex-1 relative overflow-hidden"
        style={getDesktopColor()}
      >
        {/* Desktop Icons */}
        <DesktopIcons
          onOpenWindow={openWindow}
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
            onOpenWindow={openWindow}
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