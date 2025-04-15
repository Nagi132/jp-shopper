'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/components/layouts/ThemeProvider';
import DesktopIcon from '@/components/windows/DesktopIcon';
import Taskbar from '@/components/windows/Taskbar';
import WindowManager from '@/components/windows/WindowManager';
import StartMenu from '@/components/windows/StartMenu';

/**
 * WindowsDesktop - A Windows 2000 style desktop environment
 */
const WindowsDesktop = ({ children }) => {
  const { theme } = useTheme();
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const desktopRef = useRef(null);
  
  // Desktop icons configuration
  const desktopIcons = [
    { 
      id: 'home', 
      name: 'Home', 
      icon: '/icons/home.svg',
      component: 'HomePage',
      defaultPos: { x: 20, y: 20 }
    },
    { 
      id: 'explore', 
      name: 'Explore', 
      icon: '/icons/explore.svg',
      component: 'ExplorePage',
      defaultPos: { x: 20, y: 100 }
    },
    { 
      id: 'messages', 
      name: 'Messages', 
      icon: '/icons/messages.svg',
      component: 'MessagesPage',
      defaultPos: { x: 20, y: 180 }
    },
    { 
      id: 'requests', 
      name: 'Requests', 
      icon: '/icons/requests.svg',
      component: 'RequestsPage',
      defaultPos: { x: 20, y: 260 }
    },
    { 
      id: 'favorites', 
      name: 'Favorites', 
      icon: '/icons/favorites.svg',
      component: 'FavoritesPage',
      defaultPos: { x: 20, y: 340 }
    }
  ];

  // Handle opening a new window
  const handleOpenWindow = (appId, appComponent, title) => {
    console.log(`Opening window: ${appId}, component: ${appComponent}`);
    
    // Check if window is already open
    const existingWindow = openWindows.find(w => w.id === appId);
    
    if (existingWindow) {
      // Bring to front and focus
      setActiveWindow(appId);
      
      // Restore if minimized
      if (existingWindow.minimized) {
        handleRestoreWindow(appId);
      }
    } else {
      // Create new window
      const newWindow = {
        id: appId,
        title: title || appId.charAt(0).toUpperCase() + appId.slice(1),
        component: appComponent,
        minimized: false,
        position: { x: 100 + (openWindows.length * 30), y: 80 + (openWindows.length * 30) },
        size: { width: 800, height: 600 }
      };
      
      console.log('New window created:', newWindow);
      setOpenWindows(prev => [...prev, newWindow]);
      setActiveWindow(appId);
    }
    
    // Close start menu if it's open
    if (showStartMenu) {
      setShowStartMenu(false);
    }
  };

  // Handle minimizing a window
  const handleMinimizeWindow = (windowId) => {
    setOpenWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, minimized: true } 
          : window
      )
    );
    
    // Set active window to the next non-minimized window, or null if none
    const remainingWindows = openWindows.filter(w => w.id !== windowId && !w.minimized);
    setActiveWindow(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null);
  };

  // Handle restoring a minimized window
  const handleRestoreWindow = (windowId) => {
    setOpenWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, minimized: false } 
          : window
      )
    );
    setActiveWindow(windowId);
  };

  // Handle closing a window
  const handleCloseWindow = (windowId) => {
    // Remove the window from open windows
    setOpenWindows(prev => prev.filter(window => window.id !== windowId));
    
    // Update active window
    if (activeWindow === windowId) {
      const remainingWindows = openWindows.filter(w => w.id !== windowId && !w.minimized);
      setActiveWindow(remainingWindows.length > 0 ? remainingWindows[remainingWindows.length - 1].id : null);
    }
  };

  // Handle clicking the Start button
  const handleStartClick = () => {
    setShowStartMenu(!showStartMenu);
  };

  // Handle clicking outside to close the start menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showStartMenu && !e.target.closest('.start-menu') && !e.target.closest('.start-button')) {
        setShowStartMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showStartMenu]);

  // Function to determine if a component is already open
  const isComponentOpen = (componentName) => {
    return openWindows.some(w => w.component === componentName && !w.minimized);
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
    <div className="flex flex-col h-screen relative">
      {/* Desktop area */}
      <div 
        ref={desktopRef}
        className="flex-1 relative overflow-hidden"
        style={getDesktopColor()}
      >
        {/* Desktop Icons */}
        <div className="absolute top-0 left-0 right-0 bottom-0">
          {desktopIcons.map((icon) => (
            <DesktopIcon
              key={icon.id}
              id={icon.id}
              name={icon.name}
              icon={icon.icon}
              position={icon.defaultPos}
              onClick={() => handleOpenWindow(icon.id, icon.component, icon.name)}
              isActive={isComponentOpen(icon.component)}
              theme={theme}
            />
          ))}
        </div>

        {/* Windows */}
        <WindowManager
          windows={openWindows}
          activeWindow={activeWindow}
          setActiveWindow={setActiveWindow}
          onMinimize={handleMinimizeWindow}
          onClose={handleCloseWindow}
          desktop={desktopRef}
          theme={theme}
        >
          {children}
        </WindowManager>

        {/* Start Menu */}
        {showStartMenu && (
          <StartMenu 
            onClose={() => setShowStartMenu(false)}
            onOpenWindow={handleOpenWindow}
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
          if (window.minimized) {
            handleRestoreWindow(windowId);
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