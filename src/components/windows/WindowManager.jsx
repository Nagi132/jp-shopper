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
  ProfilePage,
  ListingPage,
  ItemDetail
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
      'ListingPage': ListingPage
    };

    // Handle special case for RequestDetail
    if (componentName === 'RequestDetail') {
      // Extract ID from windowId (format: request-123)
      const id = windowId.replace('request-', '');
      return () => <RequestDetail requestId={id} />;
    }
    
    // Handle special case for ItemDetail
    if (componentName === 'ItemDetail') {
      // Extract ID from windowId (format: item-123)
      const id = windowId.replace('item-', '');
      console.log('Creating ItemDetail component with id:', id);
      return () => <ItemDetail itemId={id} />;
    }
    
    // Handle special case for ProfilePage with userId
    if (componentName === 'ProfilePage' && windowId.startsWith('profile-')) {
      // Extract user ID from windowId (format: profile-123)
      const userId = windowId.replace('profile-', '');
      console.log('Creating ProfilePage component with userId:', userId);
      return () => <ProfilePage userId={userId} isWindowView={true} />;
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
              <div className="flex flex-col items-center justify-center h-full p-4">
                <p className="text-red-500 font-bold mb-4">Content for {window.title} not found</p>
                <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-md w-full max-w-lg text-sm">
                  <h3 className="font-bold text-yellow-800 mb-2">Debug Information:</h3>
                  <p><strong>Window ID:</strong> {window.id}</p>
                  <p><strong>Component Name:</strong> {window.component}</p>
                  <p className="mt-2 text-xs text-gray-600">Check that {window.component} is properly exported from WindowContents.jsx and imported in WindowManager.jsx</p>
                </div>
              </div>
            )}
          </Window>
        );
      })}
    </div>
  );
};

export default WindowManager;