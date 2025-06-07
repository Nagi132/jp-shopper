'use client';

import React from 'react';
import { Clock, Wifi, Battery } from 'lucide-react';

/**
 * MobileTaskbar - Mobile-optimized taskbar for the desktop experience
 * Shows system status and maintains Windows aesthetic
 */
const MobileTaskbar = ({ theme }) => {
  // Get current time
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div 
      className="flex items-center justify-between px-4 py-2 border-t"
      style={{
        backgroundColor: `#${theme?.bgColor || 'ECE9D8'}`,
        borderColor: `#${theme?.borderColor || '69EFD7'}`,
        color: `#${theme?.textColor || '000000'}`,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* Left side - App info */}
      <div className="flex items-center space-x-2">
        <div 
          className="px-2 py-1 rounded border text-xs font-medium"
          style={{
            backgroundColor: `#${theme?.borderColor || '69EFD7'}20`,
            borderColor: `#${theme?.borderColor || '69EFD7'}`,
            color: `#${theme?.textColor || '000000'}`
          }}
        >
          JapanShopper
        </div>
      </div>

      {/* Center - Quick actions (optional) */}
      <div className="flex items-center space-x-2">
        {/* You could add quick action buttons here */}
      </div>

      {/* Right side - System tray */}
      <div className="flex items-center space-x-3">
        {/* Connection status */}
        <div className="flex items-center space-x-1">
          <Wifi className="w-4 h-4" />
          <Battery className="w-4 h-4" />
        </div>

        {/* Time */}
        <div 
          className="text-xs font-mono px-2 py-1 rounded border"
          style={{
            backgroundColor: `#${theme?.borderColor || '69EFD7'}10`,
            borderColor: `#${theme?.borderColor || '69EFD7'}`,
            color: `#${theme?.textColor || '000000'}`
          }}
        >
          {formatTime(time)}
        </div>
      </div>
    </div>
  );
};

export default MobileTaskbar;