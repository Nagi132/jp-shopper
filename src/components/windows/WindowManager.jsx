'use client';

import React, { useEffect, useRef } from 'react';
import Window from './Window';

/**
 * WindowManager - Manages all open windows in the Windows 2000 desktop
 * 
 * @param {Object} props
 * @param {Array} props.windows - Array of window objects
 * @param {string} props.activeWindow - ID of the currently active window
 * @param {Function} props.setActiveWindow - Function to set the active window
 * @param {Function} props.onMinimize - Function to handle minimizing a window
 * @param {Function} props.onClose - Function to handle closing a window
 * @param {Object} props.desktop - Ref to the desktop element
 * @param {Object} props.theme - Current theme
 * @param {React.ReactNode} props.children - Content to render in windows
 */
const WindowManager = ({
  windows,
  activeWindow,
  setActiveWindow,
  onMinimize,
  onClose,
  desktop,
  theme,
  children
}) => {
  // Create refs for each window for WinBox.js integration
  const windowRefs = useRef({});
  
  // Initialize window refs
  useEffect(() => {
    windows.forEach(window => {
      if (!windowRefs.current[window.id]) {
        windowRefs.current[window.id] = React.createRef();
      }
    });
    
    // Clean up refs for closed windows
    Object.keys(windowRefs.current).forEach(key => {
      if (!windows.find(w => w.id === key)) {
        delete windowRefs.current[key];
      }
    });
  }, [windows]);
  
  // Bring the active window to front
  useEffect(() => {
    if (activeWindow) {
      // Add logic for z-index management if needed
    }
  }, [activeWindow]);
  
  // Handle window focus
  const handleWindowFocus = (windowId) => {
    setActiveWindow(windowId);
  };
  
  // Handle window drag
  const handleWindowDrag = (windowId, position) => {
    // Logic for saving window position if needed
  };
  
  // Handle window resize
  const handleWindowResize = (windowId, size) => {
    // Logic for saving window size if needed
  };
  
  return (
    <div className="window-manager">
      {windows.map((window) => (
        !window.minimized && (
          <Window
            key={window.id}
            id={window.id}
            title={window.title}
            position={window.position}
            size={window.size}
            isActive={activeWindow === window.id}
            ref={windowRefs.current[window.id]}
            onFocus={() => handleWindowFocus(window.id)}
            onMinimize={() => onMinimize(window.id)}
            onClose={() => onClose(window.id)}
            onDrag={(pos) => handleWindowDrag(window.id, pos)}
            onResize={(size) => handleWindowResize(window.id, size)}
            theme={theme}
          >
          {/* Render the appropriate component for this window */}
            {React.Children.map(children, child => {
              // Debugging: Check which components we're looking for vs. what's available
              console.log('Looking for component:', window.component);
              console.log('Child id:', child?.props?.id);
              
              if (React.isValidElement(child) && child.props.id === window.component) {
                return child;
              }
              return null;
            })}
            
            {/* Fallback if no matching child component */}
            {!React.Children.toArray(children).some(child => 
              React.isValidElement(child) && child.props.id === window.component
            ) && (
              <div className="flex items-center justify-center h-full">
                <p>Loading {window.title}...</p>
              </div>
            )}
          </Window>
        )
      ))}
    </div>
  );
};

export default WindowManager;