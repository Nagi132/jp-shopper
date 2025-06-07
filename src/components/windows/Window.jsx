'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Minus, Square } from 'lucide-react';

/**
 * Window - A Windows 2000 style window component
 */
const Window = React.forwardRef(({
  id,
  title,
  position = { x: 100, y: 100 },
  size = { width: 800, height: 600 },
  isActive,
  onFocus,
  onMinimize,
  onClose,
  onDrag,
  onResize,
  theme,
  children
}, ref) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowPosition, setWindowPosition] = useState(position);
  const [windowSize, setWindowSize] = useState(size);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [prevSize, setPrevSize] = useState(null);
  const [prevPosition, setPrevPosition] = useState(null);
  const windowRef = useRef(null);
  const desktopRef = useRef(null);
  
  // Track desktop boundaries safely
  useEffect(() => {
    // Find the desktop element safely
    const findDesktopElement = () => {
      try {
        const windowManager = document.querySelector('.window-manager');
        if (windowManager && windowManager.parentElement) {
          desktopRef.current = windowManager.parentElement;
        } else {
          // Fallback to use window dimensions if we can't find the desktop
          desktopRef.current = {
            getBoundingClientRect: () => ({
              width: window.innerWidth,
              height: window.innerHeight - 40 // Subtract taskbar height
            })
          };
        }
      } catch (err) {
        console.error('Error finding desktop element:', err);
        // Fallback
        desktopRef.current = {
          getBoundingClientRect: () => ({
            width: window.innerWidth,
            height: window.innerHeight - 40
          })
        };
      }
    };
    
    findDesktopElement();
    
    // Add resize listener to update desktop size
    const handleResize = () => {
      findDesktopElement();
      constrainToDesktop();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Function to calculate text color from background
  const getContrastText = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark
    return luminance > 0.5 ? '000000' : 'FFFFFF';
  };
  
  // Handle initial focus when mounted
  useEffect(() => {
    if (isActive) {
      onFocus?.();
    }
    
    // Ensure window is within desktop bounds on mount
    if (windowRef.current && desktopRef.current) {
      constrainToDesktop();
    }
  }, [isActive, onFocus]);
  
  // Constrain window to desktop boundaries
  const constrainToDesktop = () => {
    if (!desktopRef.current || !windowRef.current) return;
    
    try {
      const desktop = desktopRef.current.getBoundingClientRect();
      const window = windowRef.current.getBoundingClientRect();
      
      // Calculate desktop boundaries relative to its parent
      const desktopBounds = {
        left: 0,
        top: 0,
        right: desktop.width - 10, // Add small margin
        bottom: desktop.height - 40, // Account for taskbar
      };
      
      let newX = windowPosition.x;
      let newY = windowPosition.y;
      
      // Constrain right edge
      if (newX + window.width > desktopBounds.right) {
        newX = desktopBounds.right - window.width;
      }
      
      // Constrain bottom edge
      if (newY + window.height > desktopBounds.bottom) {
        newY = desktopBounds.bottom - window.height;
      }
      
      // Constrain left edge
      if (newX < desktopBounds.left) {
        newX = desktopBounds.left;
      }
      
      // Constrain top edge
      if (newY < desktopBounds.top) {
        newY = desktopBounds.top;
      }
      
      // Make sure title bar is always accessible (at least 30px visible)
      if (newY < desktopBounds.top - window.height + 30) {
        newY = desktopBounds.top - window.height + 30;
      }
      
      // Update position if it changed
      if (newX !== windowPosition.x || newY !== windowPosition.y) {
        setWindowPosition({ x: newX, y: newY });
      }
    } catch (err) {
      console.error('Error constraining window:', err);
    }
  };
  
  // Expose window control methods to parent via ref
  React.useImperativeHandle(ref, () => ({
    minimize: () => onMinimize?.(),
    maximize: () => handleMaximize(),
    restore: () => setIsMaximized(false),
    focus: () => onFocus?.(),
    close: () => onClose?.()
  }));
  
  // Handle click to focus
  const handleWindowClick = (e) => {
    // Prevent refocusing if clicking a button
    if (!e.target.closest('.window-control')) {
      onFocus?.();
    }
  };
  
  // Handle window dragging
  const handleMouseDown = (e) => {
    // Only start dragging from the title bar
    if (e.target.closest('.window-titlebar') && !e.target.closest('.window-control')) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      
      // Prevent text selection during drag
      e.preventDefault();
    }
  };
  
  // Mouse move handler
  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      setWindowPosition({ x: newX, y: newY });
      if (onDrag) {
        onDrag({ x: newX, y: newY });
      }
    }
    
    if (isResizing) {
      handleResize(e);
    }
  };
  
  // Mouse up handler
  const handleMouseUp = () => {
    if (isDragging) {
      // Ensure window is within desktop bounds after dragging
      constrainToDesktop();
    }
    
    setIsDragging(false);
    setIsResizing(false);
  };
  
  // Handle window resize
  const handleResizeStart = (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setPrevSize(windowSize);
    setPrevPosition(windowPosition);
  };
  
  // Handle resize during mouse move
  const handleResize = (e) => {
    if (!isResizing || !desktopRef.current) return;
    
    try {
      const minWidth = 200;
      const minHeight = 150;
      const desktop = desktopRef.current.getBoundingClientRect();
      
      let newWidth = windowSize.width;
      let newHeight = windowSize.height;
      let newX = windowPosition.x;
      let newY = windowPosition.y;
      
      // Handle different resize directions
      if (resizeDirection.includes('e')) {
        // East (right)
        newWidth = Math.max(minWidth, e.clientX - windowPosition.x);
        // Constrain to desktop
        if (windowPosition.x + newWidth > desktop.width) {
          newWidth = desktop.width - windowPosition.x;
        }
      }
      
      if (resizeDirection.includes('w')) {
        // West (left)
        const deltaX = e.clientX - windowPosition.x;
        newWidth = Math.max(minWidth, windowSize.width - deltaX);
        newX = windowPosition.x + deltaX;
        // Constrain to desktop
        if (newX < 0) {
          newX = 0;
          newWidth = windowPosition.x + windowSize.width;
        }
      }
      
      if (resizeDirection.includes('s')) {
        // South (bottom)
        newHeight = Math.max(minHeight, e.clientY - windowPosition.y);
        // Constrain to desktop including taskbar
        if (windowPosition.y + newHeight > desktop.height - 40) {
          newHeight = desktop.height - 40 - windowPosition.y;
        }
      }
      
      if (resizeDirection.includes('n')) {
        // North (top)
        const deltaY = e.clientY - windowPosition.y;
        newHeight = Math.max(minHeight, windowSize.height - deltaY);
        newY = windowPosition.y + deltaY;
        // Constrain to desktop
        if (newY < 0) {
          newY = 0;
          newHeight = windowPosition.y + windowSize.height;
        }
      }
      
      setWindowSize({ width: newWidth, height: newHeight });
      setWindowPosition({ x: newX, y: newY });
      
      if (onResize) {
        onResize({ width: newWidth, height: newHeight });
      }
    } catch (err) {
      console.error('Error resizing window:', err);
    }
  };
  
  // Maximize window
  const handleMaximize = () => {
    if (!isMaximized && desktopRef.current) {
      // Save current position and size for restore
      setPrevSize(windowSize);
      setPrevPosition(windowPosition);
      
      const desktop = desktopRef.current.getBoundingClientRect();
      
      // Maximize to fill the container
      setIsMaximized(true);
      setWindowPosition({ x: 0, y: 0 });
      setWindowSize({ 
        width: desktop.width, 
        height: desktop.height - 40 // Adjust for taskbar
      });
    } else {
      // Restore to previous size and position
      setIsMaximized(false);
      setWindowPosition(prevPosition);
      setWindowSize(prevSize);
    }
  };
  
  // Handle double-click on title bar to maximize/restore
  const handleTitleBarDoubleClick = (e) => {
    // Only handle double-click if it's on the title bar and not on the controls
    if (e.target.closest('.window-titlebar') && !e.target.closest('.window-control')) {
      handleMaximize();
    }
  };
  
  // Handle minimize button click
  const handleMinimize = (e) => {
    e?.stopPropagation();
    onMinimize?.();
  };
  
  // Handle close button click
  const handleClose = (e) => {
    e?.stopPropagation();
    onClose?.();
  };
  
  // Add global event listeners for drag and resize
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);
  
  return (
    <div
      ref={windowRef}
      className={`absolute overflow-hidden shadow-[5px_5px_0px_rgba(0,0,0,0.2)] ${isActive ? 'z-10' : 'z-0'} ${
        isMaximized ? 'fixed inset-0' : ''
      }`}
      style={{
        left: isMaximized ? 0 : windowPosition.x,
        top: isMaximized ? 0 : windowPosition.y,
        width: isMaximized ? '100%' : windowSize.width,
        height: isMaximized ? '100%' : windowSize.height,
        border: `2px solid #${theme?.borderColor || '69EFD7'}`,
        backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
        transition: isDragging || isResizing ? 'none' : 'all 0.2s'
      }}
      onMouseDown={handleWindowClick}
    >
      {/* Title bar - now uses theme colors like the cute windows! */}
      <div 
        className="window-titlebar flex items-center justify-between h-8 px-2 select-none cursor-move"
        style={{ 
          backgroundColor: `#${theme?.borderColor || '69EFD7'}`,
          color: '#FFFFFF'
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleTitleBarDoubleClick}
      >
        <div className="text-sm font-medium">{title}</div>
        <div className="flex space-x-1">
          <button
            className="window-control flex items-center justify-center w-6 h-6 focus:outline-none hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            style={{
              color: '#FFFFFF'
            }}
            onClick={handleMinimize}
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            className="window-control flex items-center justify-center w-6 h-6 focus:outline-none hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            style={{
              color: '#FFFFFF'
            }}
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Square size={12} />
          </button>
          <button
            className="window-control flex items-center justify-center w-6 h-6 focus:outline-none hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            style={{
              color: '#FFFFFF'
            }}
            onClick={handleClose}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      
      {/* Window content */}
      <div 
        className="window-content overflow-auto"
        style={{ 
          height: 'calc(100% - 2rem)',
          backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`
        }}
      >
        {children}
      </div>
      
      {/* Resize handles - only shown when not maximized */}
      {!isMaximized && (
        <>
          <div 
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10"
            onMouseDown={(e) => handleResizeStart('nw', e)}
          />
          <div 
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-10"
            onMouseDown={(e) => handleResizeStart('ne', e)}
          />
          <div 
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-10"
            onMouseDown={(e) => handleResizeStart('sw', e)}
          />
          <div 
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10"
            onMouseDown={(e) => handleResizeStart('se', e)}
          />
          <div 
            className="absolute top-0 left-3 right-3 h-2 cursor-n-resize z-10"
            onMouseDown={(e) => handleResizeStart('n', e)}
          />
          <div 
            className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize z-10"
            onMouseDown={(e) => handleResizeStart('s', e)}
          />
          <div 
            className="absolute left-0 top-3 bottom-3 w-2 cursor-w-resize z-10"
            onMouseDown={(e) => handleResizeStart('w', e)}
          />
          <div 
            className="absolute right-0 top-3 bottom-3 w-2 cursor-e-resize z-10"
            onMouseDown={(e) => handleResizeStart('e', e)}
          />
        </>
      )}
    </div>
  );
});

Window.displayName = 'Window';

export default Window;