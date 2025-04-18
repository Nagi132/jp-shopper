'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useContextMenu } from '@/components/windows/ContextMenu';
import SystemTray from '@/components/windows/SystemTray';
import { useApp } from '@/contexts/AppContext';

/**
 * Enhanced Taskbar - Windows 2000 style taskbar with system tray
 * 
 * Features:
 * - Start button
 * - Window buttons for task switching
 * - System tray with clock and status icons
 * - Context menus
 * - Proper styling and theme integration
 */
export default function Taskbar({
  windows,
  activeWindow,
  onStartClick,
  startMenuOpen,
  onWindowClick,
  theme
}) {
  const { showContextMenu } = useContextMenu();
  const { minimizeWindow, restoreWindow, closeWindow } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWindowIndex, setDraggedWindowIndex] = useState(null);
  const taskbarRef = useRef(null);
  const [windowButtons, setWindowButtons] = useState([]);
  
  // Initialize windowButtons state from props
  useEffect(() => {
    setWindowButtons(windows.map((window, index) => ({
      ...window,
      index
    })));
  }, [windows]);
  
  // Handle right-click on taskbar
  const handleTaskbarContextMenu = (e) => {
    // Only show context menu if not clicking on a button or system tray
    if (!e.target.closest('button') && !e.target.closest('.system-tray')) {
      showContextMenu(e, 'taskbar');
    }
  };
  
  // Handle window button right-click
  const handleWindowButtonContextMenu = (e, windowId, isMaximized) => {
    showContextMenu(e, 'window', { windowId, isMaximized });
  };
  
  // Start dragging a window button for reordering
  const handleDragStart = (e, index) => {
    setIsDragging(true);
    setDraggedWindowIndex(index);
  };
  
  // Handle dragging over another window button
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (isDragging && draggedWindowIndex !== null && draggedWindowIndex !== index) {
      // Reorder the window buttons
      const newButtons = [...windowButtons];
      const draggedButton = newButtons[draggedWindowIndex];
      
      // Remove the dragged button
      newButtons.splice(draggedWindowIndex, 1);
      
      // Insert it at the new position
      newButtons.splice(index, 0, draggedButton);
      
      // Update state
      setWindowButtons(newButtons);
      setDraggedWindowIndex(index);
    }
  };
  
  // End dragging
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedWindowIndex(null);
  };
  
  // Double-click to maximize/restore
  const handleDoubleClick = (windowId) => {
    const window = windows.find(w => w.id === windowId);
    if (window) {
      if (window.isMaximized) {
        restoreWindow(windowId);
      } else {
        onWindowClick(windowId);
      }
    }
  };
  
  // Window button click
  const handleWindowClick = (windowId) => {
    const window = windows.find(w => w.id === windowId);
    if (window) {
      if (window.minimized) {
        restoreWindow(windowId);
      } else if (activeWindow === windowId) {
        minimizeWindow(windowId);
      } else {
        onWindowClick(windowId);
      }
    }
  };
  
  // Calculate contrasting text color for the theme
  const getContrastTextColor = (hexColor) => {
    try {
      // Convert hex to RGB
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return black for light colors, white for dark
      return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (err) {
      return '#000000'; // Default to black on error
    }
  };
  
  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  const textColor = theme?.textColor || getContrastTextColor(bgColor);
  
  return (
    <div 
      ref={taskbarRef}
      className="taskbar h-10 flex items-center py-1 px-2 border-t z-50"
      style={{ 
        backgroundColor: `#${bgColor}`,
        borderColor: `#${borderColor}`,
        color: `#${textColor}`,
      }}
      onContextMenu={handleTaskbarContextMenu}
    >
      {/* Start Button */}
      <button
        className="start-button h-8 px-2 flex items-center rounded-sm font-semibold mr-2"
        onClick={onStartClick}
        style={{
          backgroundColor: startMenuOpen ? `#${borderColor}` : `#${bgColor}`,
          border: `1px solid #${borderColor}`,
          boxShadow: startMenuOpen ? 'inset 1px 1px 1px rgba(0,0,0,0.2)' : '1px 1px 1px rgba(255,255,255,0.5)',
          color: startMenuOpen ? getContrastTextColor(borderColor) : textColor,
        }}
      >
        <div 
          className="w-4 h-4 mr-1 flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(45deg, #${borderColor}, #${bgColor})`,
            borderRadius: '1px',
          }}
        >
          <div className="windows-logo w-3 h-3 grid grid-cols-2 gap-0.5">
            <div className="bg-red-500"></div>
            <div className="bg-green-500"></div>
            <div className="bg-blue-500"></div>
            <div className="bg-yellow-500"></div>
          </div>
        </div>
        <span>Start</span>
      </button>
      
      {/* Divider */}
      <div 
        className="h-8 border-l mx-1"
        style={{ borderColor: `#${borderColor}40` }}
      ></div>
      
      {/* Quick Launch */}
      <div className="flex items-center space-x-1 mr-2">
        <button 
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20"
          title="Internet Explorer"
          onClick={() => window.open('https://www.google.com', '_blank')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" fill="#0078D7" />
            <path d="M13 8C13 5.23858 10.7614 3 8 3C5.23858 3 3 5.23858 3 8C3 10.7614 5.23858 13 8 13C10.7614 13 13 10.7614 13 8Z" stroke="white" strokeWidth="1.5" />
            <path d="M3 8H13" stroke="white" strokeWidth="1.5" />
            <path d="M8 3V13" stroke="white" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20"
          title="Windows Explorer"
          onClick={() => {
            window.postMessage({ type: 'open-explorer' }, '*');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="12" height="12" rx="1" fill="#FFCC00" stroke="#333" />
            <rect x="3" y="5" width="10" height="8" fill="white" />
            <rect x="4" y="7" width="3" height="2" fill="#0078D7" />
            <rect x="9" y="7" width="3" height="2" fill="#0078D7" />
            <rect x="4" y="10" width="8" height="1" fill="#333" />
          </svg>
        </button>
      </div>
      
      {/* Window Buttons */}
      <div className="flex-1 flex space-x-1 overflow-x-auto">
        {windowButtons.map((window, index) => (
          <button
            key={window.id}
            className={`h-8 px-2 text-sm truncate min-w-28 max-w-48 flex items-center rounded-sm
              ${activeWindow === window.id ? 'font-medium' : ''}
              ${window.minimized ? 'opacity-60' : ''}`}
            style={{
              backgroundColor: activeWindow === window.id ? `#${borderColor}30` : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: activeWindow === window.id ? `#${borderColor}` : `#${borderColor}50`,
              boxShadow: window.minimized ? 'none' : '1px 1px 1px rgba(255,255,255,0.2)',
              color: window.minimized ? `${textColor}80` : textColor,
            }}
            onClick={() => handleWindowClick(window.id)}
            onDoubleClick={() => handleDoubleClick(window.id)}
            onContextMenu={(e) => handleWindowButtonContextMenu(e, window.id, window.isMaximized)}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div 
              className="w-4 h-4 mr-2 flex-shrink-0"
              style={{
                backgroundColor: `#${window.minimized ? bgColor : borderColor}30`,
                borderRadius: '2px',
              }}
            ></div>
            <span className="truncate">{window.title}</span>
          </button>
        ))}
      </div>
      
      {/* System Tray */}
      <div className="system-tray h-full">
        <SystemTray theme={theme} />
      </div>
    </div>
  );
}