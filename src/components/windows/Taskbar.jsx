'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Volume2, Wifi } from 'lucide-react';

/**
 * Taskbar - A Windows 2000 style taskbar
 * 
 * @param {Object} props
 * @param {Array} props.windows - List of open windows
 * @param {string} props.activeWindow - ID of the active window
 * @param {Function} props.onStartClick - Function to handle Start button click
 * @param {boolean} props.startMenuOpen - Whether the Start menu is open
 * @param {Function} props.onWindowClick - Function to handle clicking a window button
 * @param {Object} props.theme - Theme colors
 */
const Taskbar = ({
  windows,
  activeWindow,
  onStartClick,
  startMenuOpen,
  onWindowClick,
  theme
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update the clock every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format the time
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div 
      className="taskbar h-10 flex items-center py-1 px-2 border-t z-10"
      style={{ 
        backgroundColor: `#${theme.bgColor}`,
        borderColor: `#${theme.borderColor}`,
      }}
    >
      {/* Start Button */}
      <button
        className={`start-button h-8 px-2 flex items-center rounded-sm font-semibold mr-2 ${startMenuOpen ? 'active' : ''}`}
        onClick={onStartClick}
        style={{
          backgroundColor: startMenuOpen ? `#${theme.borderColor}` : `#${theme.bgColor}`,
          border: `1px solid #${theme.borderColor}`,
          boxShadow: startMenuOpen ? 'inset 1px 1px 1px rgba(0,0,0,0.2)' : '1px 1px 1px rgba(255,255,255,0.5)',
          color: startMenuOpen ? '#FFFFFF' : '#000000',
        }}
      >
        <div 
          className="w-4 h-4 mr-1 flex items-center justify-center"
          style={{
            backgroundImage: `linear-gradient(45deg, #${theme.borderColor}, #${theme.bgColor})`,
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
        style={{ borderColor: `#${theme.borderColor}40` }}
      ></div>
      
      {/* Window Buttons */}
      <div className="flex-1 flex space-x-1 overflow-x-auto">
        {windows.map((window) => (
          <button
            key={window.id}
            className={`h-8 px-2 text-sm truncate min-w-28 max-w-48 flex items-center rounded-sm`}
            onClick={() => onWindowClick(window.id)}
            style={{
              backgroundColor: activeWindow === window.id ? `#${theme.borderColor}30` : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: activeWindow === window.id ? `#${theme.borderColor}` : `#${theme.borderColor}50`,
              boxShadow: window.minimized ? 'none' : '1px 1px 1px rgba(255,255,255,0.2)',
              color: window.minimized ? '#666666' : '#000000',
            }}
          >
            <div 
              className="w-4 h-4 mr-2 flex-shrink-0"
              style={{
                backgroundColor: `#${window.minimized ? theme.bgColor : theme.borderColor}30`,
                borderRadius: '2px',
              }}
            ></div>
            <span className="truncate">{window.title}</span>
          </button>
        ))}
      </div>
      
      {/* System Tray */}
      <div className="system-tray flex items-center h-8 px-2 ml-1">
        <div className="flex space-x-2 items-center border-l pl-2" style={{ borderColor: `#${theme.borderColor}40` }}>
          <Volume2 size={14} />
          <Wifi size={14} />
          <div className="flex items-center text-xs px-2 py-1 bg-white rounded-sm ml-1">
            <Clock size={13} className="mr-1" />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;