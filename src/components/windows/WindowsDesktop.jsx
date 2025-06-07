'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import { useApp } from '@/contexts/AppContext';
import { usePathname } from 'next/navigation';
import DesktopIcons from './DesktopIcons';
import Taskbar from './Taskbar';
import WindowManager from './WindowManager';
import StartMenu from './StartMenu';
import MobilePageView from './MobilePageView';

/**
 * WindowsDesktop - A Windows 2000 style desktop environment
 * On mobile, shows a full-screen page view instead
 */
const WindowsDesktop = ({ children }) => {
  const { theme } = useTheme();
  const pathname = usePathname();
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
  const [isMobile, setIsMobile] = useState(false);
  const desktopRef = useRef(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Calculate desktop style based on theme
  const getDesktopStyle = () => {
    const baseStyle = {
      backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
    };

    // Handle background patterns and images
    if (theme?.pattern && theme.pattern !== 'none') {
      if (theme.pattern.startsWith('data:image/') || theme.pattern.startsWith('/desktop/')) {
        // Handle image backgrounds
        baseStyle.backgroundImage = `url(${theme.pattern})`;
        baseStyle.backgroundSize = 'cover';
        baseStyle.backgroundPosition = 'center';
        baseStyle.backgroundRepeat = 'no-repeat';
      } else {
        // Handle CSS pattern backgrounds
        baseStyle.backgroundImage = theme.pattern;
        baseStyle.backgroundSize = '20px 20px';
        baseStyle.backgroundRepeat = 'repeat';
      }
    }

    return baseStyle;
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

  // If mobile, render mobile page view
  if (isMobile) {
    return (
      <div 
        className="h-full w-full"
        style={{ 
          backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
        }}
      >
        <MobilePageView 
          pathname={pathname}
          theme={theme}
        />
      </div>
    );
  }

  // Desktop view (existing functionality)
  return (
    <div className="flex flex-col h-screen relative" onClick={handleOutsideClick}>
      {/* Desktop area */}
      <div 
        ref={desktopRef}
        className="flex-1 relative overflow-hidden"
        style={getDesktopStyle()}
      >
        {/* Optional overlay for desktop opacity effect */}
        {(theme?.desktopOpacity !== undefined && theme.desktopOpacity > 0 && theme.desktopOpacity < 1) && (
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{
              backgroundColor: `#${theme.bgColor}`,
              opacity: 1 - theme.desktopOpacity,
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