// src/contexts/AppContext.jsx
'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import WindowStateManager from '@/lib/windowStateManager';

// Create context
const AppContext = createContext(null);

/**
 * AppProvider - Manages application state, windows, and URL syncing
 * 
 * This context provider handles:
 * - Managing open windows
 * - Syncing URL state with windows
 * - Tracking active window
 * - Programmatically opening windows
 * - Saving and restoring window states
 */
export function AppProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [openWindows, setOpenWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [isDesktopReady, setIsDesktopReady] = useState(false);
  const [desktopSize, setDesktopSize] = useState({ width: 0, height: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowsLoaded, setWindowsLoaded] = useState(false);
  const desktopRef = useRef(null);
  
  // Route mappings for window components
  const routeToWindowMap = {
    '/explore': { id: 'explore', component: 'ExplorePage', title: 'Explore' },
    '/requests': { id: 'requests', component: 'RequestsPage', title: 'Requests' },
    '/messages': { id: 'messages', component: 'MessagesPage', title: 'Messages' },
    '/favorites': { id: 'favorites', component: 'FavoritesPage', title: 'Favorites' },
    '/settings': { id: 'settings', component: 'SettingsPage', title: 'Settings' },
    '/notifications': { id: 'notifications', component: 'NotificationsPage', title: 'Notifications' },
    '/': { id: 'home', component: 'HomePage', title: 'Home' }
  };

  // Get the desktop size from the desktop ref
  const updateDesktopSize = () => {
    if (desktopRef.current) {
      const { clientWidth, clientHeight } = desktopRef.current;
      setDesktopSize({ width: clientWidth, height: clientHeight });
    } else if (typeof window !== 'undefined') {
      // Fallback to window size if desktop ref not available
      setDesktopSize({ 
        width: window.innerWidth, 
        height: window.innerHeight - 40 // Account for taskbar
      });
    }
  };

  // Update desktop size on window resize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        updateDesktopSize();
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Save window states when they change
  useEffect(() => {
    if (openWindows.length > 0 && windowsLoaded) {
      WindowStateManager.saveWindowStates(openWindows);
    }
  }, [openWindows, windowsLoaded]);

  // Load saved window states
  useEffect(() => {
    if (isDesktopReady && !windowsLoaded) {
      const savedWindows = WindowStateManager.loadWindowStates();
      
      if (savedWindows && savedWindows.length > 0) {
        // Restore saved windows
        setOpenWindows(savedWindows);
        
        // Set the last active window as active
        const lastActiveWindow = savedWindows.reduce((active, window) => {
          return window.zIndex > (active?.zIndex || 0) ? window : active;
        }, null);
        
        if (lastActiveWindow) {
          setActiveWindow(lastActiveWindow.id);
        }
      }
      
      setWindowsLoaded(true);
    }
  }, [isDesktopReady, windowsLoaded]);

  // Handle URL changes to sync with windows
  useEffect(() => {
    if (!isDesktopReady || !pathname || !windowsLoaded) return;

    // Find matching route
    const route = Object.entries(routeToWindowMap).find(([route]) => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (route) {
      const [_, windowInfo] = route;
      openWindow(windowInfo.id, windowInfo.component, windowInfo.title);
    }
  }, [pathname, isDesktopReady, windowsLoaded]);

  // Set desktop ref
  const setDesktopElement = (ref) => {
    desktopRef.current = ref;
    updateDesktopSize();
  };

  // Open window and optionally update URL
  const openWindow = (appId, appComponent, title, updateUrl = false) => {
    // Check if window is already open
    const existingWindow = openWindows.find(w => w.id === appId);
    
    if (existingWindow) {
      // Bring to front and focus
      setActiveWindow(appId);
      
      // Restore if minimized
      if (existingWindow.minimized) {
        restoreWindow(appId);
      }
      
      // Update z-index to bring to front
      setOpenWindows(prev => prev.map(window => ({
        ...window,
        zIndex: window.id === appId ? Date.now() : window.zIndex
      })));
    } else {
      // Get default window size for this component type
      const size = WindowStateManager.getDefaultWindowSize(appComponent, desktopSize);
      
      // Calculate cascade position for new window
      const position = WindowStateManager.getNewWindowPosition(openWindows, desktopSize);
      
      // Create new window
      const newWindow = {
        id: appId,
        title: title || appId.charAt(0).toUpperCase() + appId.slice(1),
        component: appComponent,
        minimized: false,
        isMaximized: false,
        position,
        size,
        zIndex: Date.now() // Use timestamp for z-index to ensure newest window is on top
      };
      
      setOpenWindows(prev => [...prev, newWindow]);
      setActiveWindow(appId);
    }
    
    // Update URL if requested and not already on this route
    if (updateUrl) {
      // Find the route that matches this window
      const route = Object.entries(routeToWindowMap).find(([_, info]) => 
        info.id === appId
      );
      
      if (route && route[0] !== pathname) {
        router.push(route[0]);
      }
    }
  };

  // Minimize window
  const minimizeWindow = (windowId) => {
    setOpenWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, minimized: true } 
          : window
      )
    );
    
    // Set active window to the next non-minimized window, or null if none
    const remainingWindows = openWindows.filter(w => w.id !== windowId && !w.minimized);
    if (remainingWindows.length > 0) {
      const nextActive = remainingWindows.reduce((highest, window) => {
        return window.zIndex > highest.zIndex ? window : highest;
      }, remainingWindows[0]);
      setActiveWindow(nextActive.id);
    } else {
      setActiveWindow(null);
    }
  };

  // Restore minimized window
  const restoreWindow = (windowId) => {
    setOpenWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, minimized: false, zIndex: Date.now() } 
          : window
      )
    );
    setActiveWindow(windowId);
  };

  // Maximize window
  const maximizeWindow = (windowId) => {
    // Save current position and size before maximizing
    const windowToMaximize = openWindows.find(w => w.id === windowId);
    
    if (windowToMaximize && !windowToMaximize.isMaximized) {
      // Save the current position and size before maximizing
      const prevState = {
        position: { ...windowToMaximize.position },
        size: { ...windowToMaximize.size }
      };
      
      setOpenWindows(prev => 
        prev.map(window => 
          window.id === windowId 
            ? { 
                ...window, 
                isMaximized: true,
                prevState, // Store previous state for restoration
                position: { x: 0, y: 0 },
                size: { width: desktopSize.width, height: desktopSize.height }
              } 
            : window
        )
      );
    }
  };

  // Restore maximized window
  const restoreMaximizedWindow = (windowId) => {
    const windowToRestore = openWindows.find(w => w.id === windowId);
    
    if (windowToRestore && windowToRestore.isMaximized) {
      setOpenWindows(prev => 
        prev.map(window => 
          window.id === windowId 
            ? { 
                ...window, 
                isMaximized: false,
                position: window.prevState ? window.prevState.position : window.position,
                size: window.prevState ? window.prevState.size : window.size,
                prevState: null
              } 
            : window
        )
      );
    }
  };

  // Close window
  const closeWindow = (windowId) => {
    // Remove the window from open windows
    setOpenWindows(prev => prev.filter(window => window.id !== windowId));
    
    // Update active window
    if (activeWindow === windowId) {
      const remainingWindows = openWindows.filter(w => w.id !== windowId && !w.minimized);
      if (remainingWindows.length > 0) {
        // Find the window with highest z-index
        const nextActive = remainingWindows.reduce((highest, window) => {
          return window.zIndex > highest.zIndex ? window : highest;
        }, remainingWindows[0]);
        setActiveWindow(nextActive.id);
      } else {
        setActiveWindow(null);
      }
    }
    
    // Clean up saved states for closed windows
    const currentWindowIds = openWindows
      .filter(window => window.id !== windowId)
      .map(window => window.id);
    WindowStateManager.cleanupWindowStates(currentWindowIds);
  };

  // Update window position
  const updateWindowPosition = (windowId, position) => {
    // Ensure position is within desktop bounds
    const window = openWindows.find(w => w.id === windowId);
    if (!window) return;
    
    const constrainedPosition = WindowStateManager.constrainWindowToDesktop(
      position,
      window.size,
      desktopSize
    );
    
    setOpenWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, position: constrainedPosition } 
          : window
      )
    );
  };

  // Update window size
  const updateWindowSize = (windowId, size) => {
    setOpenWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, size } 
          : window
      )
    );
  };

  // Check if app routes to desktop environment
  const shouldUseDesktop = (path) => {
    // Logic to determine if route should use desktop
    // Could be based on user preferences, route patterns, etc.
    return true; // For now, always use desktop
  };

  // Minimize all windows (show desktop)
  const showDesktop = () => {
    setOpenWindows(prev => 
      prev.map(window => ({ ...window, minimized: true }))
    );
    setActiveWindow(null);
  };

  // Restore all windows
  const restoreAllWindows = () => {
    setOpenWindows(prev => 
      prev.map(window => ({ ...window, minimized: false }))
    );
    
    // Find the window with highest z-index
    const topWindow = openWindows.reduce((highest, window) => {
      return window.zIndex > highest.zIndex ? window : highest;
    }, openWindows[0]);
    
    if (topWindow) {
      setActiveWindow(topWindow.id);
    }
  };

  // Notify when desktop is ready to handle windows
  const setDesktopReady = () => {
    setIsDesktopReady(true);
    updateDesktopSize();
  };

  // Create context value
  const contextValue = {
    openWindows,
    activeWindow,
    isDesktopReady,
    desktopSize,
    setActiveWindow,
    openWindow,
    minimizeWindow,
    restoreWindow,
    maximizeWindow,
    restoreMaximizedWindow,
    closeWindow,
    updateWindowPosition,
    updateWindowSize,
    shouldUseDesktop,
    showDesktop,
    restoreAllWindows,
    setDesktopReady,
    setDesktopElement
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook for using AppContext
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;