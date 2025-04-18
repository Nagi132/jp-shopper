'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Wifi, Battery, Clock, Globe, LifeBuoy,
  Bell, Shield, Printer, X, ChevronUp, Info, Mail,
  Check
} from 'lucide-react';

/**
 * SystemTray - A Windows 2000 style system tray with notifications
 * 
 * Features:
 * - Clock with current time
 * - System icons (volume, wifi, etc.)
 * - Notification badges
 * - Pop-up notifications
 * - Clickable tray icons with menus
 */
export default function SystemTray({ theme = {} }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [trayMenuOpen, setTrayMenuOpen] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const trayRef = useRef(null);
  
  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Update the clock every minute
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(clockInterval);
  }, []);
  
  // Format the time in a Windows 2000 style
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format the date in a Windows 2000 style
  const formatDate = (date) => {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Add a demo notification after component mounts
  useEffect(() => {
    // Demo notification
    setTimeout(() => {
      addNotification({
        id: 'welcome',
        title: 'Windows 2000',
        message: 'Welcome to the Windows 2000 Desktop',
        icon: <Info size={16} />,
        timestamp: new Date(),
        autoClose: true
      });
    }, 3000);
    
    // Another demo notification
    setTimeout(() => {
      addNotification({
        id: 'mail',
        title: 'New Message',
        message: 'You have 1 new message from JapanShopper',
        icon: <Mail size={16} />,
        timestamp: new Date(),
        autoClose: true
      });
    }, 7000);
    
    // Cleanup any open notifications on unmount
    return () => {
      if (activePopup) {
        setActivePopup(null);
      }
    };
  }, []);
  
  // Add a notification to the tray
  const addNotification = (notification) => {
    // Add a unique ID if not provided
    const newNotification = {
      ...notification,
      id: notification.id || `notif-${Date.now()}`
    };
    
    // Update notifications array
    setNotifications(prev => [newNotification, ...prev]);
    
    // Increment notification count
    setNotificationCount(prev => prev + 1);
    
    // Show popup
    setActivePopup(newNotification);
    
    // Auto-close the popup after 5 seconds if requested
    if (notification.autoClose) {
      setTimeout(() => {
        // Only close if this is still the active popup
        setActivePopup(popup => 
          popup && popup.id === newNotification.id ? null : popup
        );
      }, 5000);
    }
    
    return newNotification.id;
  };
  
  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    
    // Decrement count
    setNotificationCount(prev => Math.max(0, prev - 1));
    
    // Close popup if it's the active one
    if (activePopup && activePopup.id === id) {
      setActivePopup(null);
    }
  };
  
  // Handle clicking on a notification in the tray
  const handleNotificationClick = (notification) => {
    // Toggle the popup
    setActivePopup(currentPopup => 
      currentPopup && currentPopup.id === notification.id 
        ? null 
        : notification
    );
  };
  
  // Handle click outside to close popups
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (trayRef.current && !trayRef.current.contains(e.target)) {
        setTrayMenuOpen(false);
        
        // Don't close notification popup when clicking outside if it's auto-close
        if (activePopup && !activePopup.autoClose) {
          setActivePopup(null);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopup]);
  
  // Define tray icons (visible and hidden)
  const visibleIcons = [
    { id: 'volume', icon: <Volume2 size={14} />, tooltip: 'Volume' },
    { 
      id: 'network', 
      icon: <Wifi size={14} />, 
      tooltip: 'Connected',
      status: 'Connected to Internet'
    },
    { 
      id: 'notifications', 
      icon: <Bell size={14} />, 
      tooltip: 'Notifications',
      badge: notificationCount > 0 ? notificationCount : null,
      onClick: () => setTrayMenuOpen(!trayMenuOpen)
    }
  ];
  
  const hiddenIcons = [
    { id: 'security', icon: <Shield size={14} />, tooltip: 'Security' },
    { id: 'printer', icon: <Printer size={14} />, tooltip: 'No printers' },
    { id: 'updates', icon: <LifeBuoy size={14} />, tooltip: 'Windows Update' },
    { id: 'battery', icon: <Battery size={14} />, tooltip: 'Battery: 100%' }
  ];
  
  // Determine which icons to show
  const displayedIcons = showAllIcons 
    ? [...visibleIcons, ...hiddenIcons]
    : visibleIcons;
    
  return (
    <div 
      ref={trayRef}
      className="system-tray h-full flex items-center px-1 relative"
      style={{ backgroundColor: `#${bgColor}30` }}
    >
      {/* Hidden icons toggle button */}
      {hiddenIcons.length > 0 && (
        <button
          className="h-6 px-1 mx-0.5 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-sm"
          onClick={() => setShowAllIcons(!showAllIcons)}
          title={showAllIcons ? 'Hide icons' : 'Show hidden icons'}
        >
          <ChevronUp 
            size={12} 
            className={`transform transition-transform ${showAllIcons ? '' : 'rotate-180'}`}
          />
        </button>
      )}
      
      {/* System Tray Icons */}
      <div className="flex items-center space-x-1 pr-1 border-r border-gray-400">
        {displayedIcons.map((icon) => (
          <TrayIcon 
            key={icon.id}
            icon={icon.icon}
            tooltip={icon.tooltip}
            badge={icon.badge}
            onClick={icon.onClick}
          />
        ))}
      </div>
      
      {/* Clock */}
      <button 
        className="flex items-center justify-center h-full px-2 hover:bg-white hover:bg-opacity-10"
        title={formatDate(currentTime)}
      >
        <Clock size={14} className="mr-1" />
        <span className="text-xs">{formatTime(currentTime)}</span>
      </button>
      
      {/* Notification Popup */}
      {activePopup && (
        <NotificationPopup
          notification={activePopup}
          onClose={() => setActivePopup(null)}
          position="top-right"
          theme={theme}
        />
      )}
      
      {/* Notifications Menu */}
      {trayMenuOpen && (
        <div 
          className="absolute bottom-10 right-1 w-64 bg-white border shadow-md z-50"
          style={{ 
            borderColor: `#${borderColor}`,
            boxShadow: `3px 3px 10px rgba(0,0,0,0.2)`
          }}
        >
          <div 
            className="flex items-center justify-between p-2 border-b"
            style={{ 
              backgroundColor: `#${borderColor}`,
              color: '#FFFFFF'
            }}
          >
            <h3 className="text-xs font-bold">Notifications</h3>
            <button 
              className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-white hover:bg-opacity-20"
              onClick={() => setTrayMenuOpen(false)}
            >
              <X size={12} />
            </button>
          </div>
          
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className="p-2 border-b hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <span className="mt-0.5 mr-2 text-blue-500">
                        {notification.icon || <Info size={14} />}
                      </span>
                      <div>
                        <div className="font-medium text-xs">{notification.title}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{notification.message}</div>
                      </div>
                    </div>
                    <button 
                      className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t flex justify-end">
              <button 
                className="text-xs text-blue-600 hover:underline"
                onClick={() => {
                  setNotifications([]);
                  setNotificationCount(0);
                  setTrayMenuOpen(false);
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * TrayIcon - Individual system tray icon component
 */
function TrayIcon({ icon, tooltip, badge = null, onClick }) {
  return (
    <button
      className="relative h-6 w-6 flex items-center justify-center hover:bg-white hover:bg-opacity-20 rounded-sm"
      title={tooltip}
      onClick={onClick}
    >
      {icon}
      {badge !== null && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

/**
 * NotificationPopup - Windows 2000 style notification popup
 */
function NotificationPopup({ 
  notification, 
  onClose, 
  position = 'bottom-right',
  theme = {} 
}) {
  const popupRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);
  
  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Handle animation for smooth entrance and exit
  useEffect(() => {
    // Add entrance animation class after mount
    const timer = setTimeout(() => {
      if (popupRef.current) {
        popupRef.current.classList.add('notification-enter-active');
      }
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle close with animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Wait for animation to complete
  };
  
  // Calculate position styles based on requested position
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return {
          top: '10px',
          right: '10px',
        };
      case 'top-left':
        return {
          top: '10px',
          left: '10px',
        };
      case 'bottom-left':
        return {
          bottom: '50px',
          left: '10px',
        };
      case 'bottom-right':
      default:
        return {
          bottom: '50px',
          right: '10px',
        };
    }
  };
  
  return (
    <div
      ref={popupRef}
      className={`fixed z-[1001] w-64 shadow-lg notification-enter ${isExiting ? 'notification-exit' : ''}`}
      style={{
        ...getPositionStyles(),
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `#${borderColor}`,
        backgroundColor: 'white',
      }}
    >
      <style jsx>{`
        .notification-enter {
          opacity: 0;
          transform: translateY(20px);
        }
        .notification-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 300ms, transform 300ms;
        }
        .notification-exit {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 300ms, transform 300ms;
        }
      `}</style>
      
      <div 
        className="flex items-center justify-between p-2"
        style={{ 
          backgroundColor: `#${borderColor}`,
          color: '#FFFFFF'
        }}
      >
        <h3 className="text-xs font-bold truncate">{notification.title}</h3>
        <button 
          className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-white hover:bg-opacity-20"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={12} />
        </button>
      </div>
      
      <div className="p-3 bg-white">
        <div className="flex items-start">
          <span className="mt-0.5 mr-3 text-blue-500">
            {notification.icon || <Info size={18} />}
          </span>
          <div>{notification.message}</div>
        </div>
        
        <div className="flex justify-end mt-3">
          <button 
            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            onClick={handleClose}
          >
            <Check size={10} className="inline mr-1" />
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * useNotifications - A hook to use the notification system in any component
 * 
 * Usage example:
 * const { addNotification, removeNotification } = useNotifications();
 * 
 * // Add a notification
 * addNotification({
 *   title: 'Hello',
 *   message: 'This is a notification',
 *   icon: <Info size={16} />,
 *   autoClose: true
 * });
 */
const NotificationContext = React.createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  
  // Add a notification
  const addNotification = (notification) => {
    // Add a unique ID if not provided
    const newNotification = {
      ...notification,
      id: notification.id || `notif-${Date.now()}`,
      timestamp: notification.timestamp || new Date()
    };
    
    // Update notifications array
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show popup
    setActivePopup(newNotification);
    
    // Auto-close the popup after 5 seconds if requested
    if (notification.autoClose) {
      setTimeout(() => {
        // Only close if this is still the active popup
        setActivePopup(popup => 
          popup && popup.id === newNotification.id ? null : popup
        );
      }, 5000);
    }
    
    return newNotification.id;
  };
  
  // Remove a notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    
    // Close popup if it's the active one
    if (activePopup && activePopup.id === id) {
      setActivePopup(null);
    }
  };
  
  // Close active popup
  const closePopup = () => {
    setActivePopup(null);
  };
  
  // Context value
  const contextValue = {
    notifications,
    activePopup,
    addNotification,
    removeNotification,
    closePopup
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Render active popup */}
      {activePopup && (
        <NotificationPopup
          notification={activePopup}
          onClose={closePopup}
          position="bottom-right"
        />
      )}
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}