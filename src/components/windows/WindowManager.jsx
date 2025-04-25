'use client';

import React, { useEffect, useRef } from 'react';
import Window from './Window';
import { useApp } from '@/contexts/AppContext';
import { MessageBoxProvider } from './MessageBoxProvider';
import { DialogProvider } from '@/components/windows/MessageBox';

// Import all window content components
import { 
  HomePage,
  ExplorePage,
  MessagesPage,
  RequestsPage,
  FavoritesPage,
  NotificationsPage,
  SettingsPage,
  HelpPage,
  RequestDetail,
  NewRequestPage,
  ProfilePage
} from './WindowContents';

/**
 * WindowManager - Manages all open windows in the Windows 2000 desktop
 * Updated to use AppContext and handle special windows like RequestDetail
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
  // Create refs for each window
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

  // Get the appropriate component for a window
  const getWindowComponent = (componentName, windowId) => {
    // Regular components
    const componentMap = {
      'HomePage': HomePage,
      'ExplorePage': ExplorePage,
      'MessagesPage': MessagesPage,
      'RequestsPage': RequestsPage,
      'FavoritesPage': FavoritesPage,
      'NotificationsPage': NotificationsPage,
      'SettingsPage': SettingsPage,
      'HelpPage': HelpPage,
      'NewRequestPage': NewRequestPage,
      'ProfilePage': ProfilePage,
    };

    // Handle special case for RequestDetail
    if (componentName === 'RequestDetail') {
      // Extract ID from windowId (format: request-123)
      const id = windowId.replace('request-', '');
      return () => <RequestDetail requestId={id} />;
    }

    return componentMap[componentName] || null;
  };

  return (
    <div className="window-manager">
      {windows.map((window) => {
        if (window.minimized) return null;

        // Get the component to render in this window
        const WindowContent = getWindowComponent(window.component, window.id);

        return (
          <Window
            key={window.id}
            id={window.id}
            title={window.title}
            position={window.position}
            size={window.size}
            isActive={activeWindow === window.id}
            ref={windowRefs.current[window.id]}
            onFocus={() => setActiveWindow(window.id)}
            onMinimize={() => onMinimize(window.id)}
            onClose={() => onClose(window.id)}
            theme={theme}
          >
            {WindowContent ? (
              <DialogProvider>
                <MessageBoxProvider>
                  <WindowContent />
                </MessageBoxProvider>
              </DialogProvider>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p>Content for {window.title} not found</p>
              </div>
            )}
          </Window>
        );
      })}
    </div>
  );
};

export default WindowManager;