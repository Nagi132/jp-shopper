// src/components/windows/DesktopIcons.jsx
'use client';

import React, { useMemo } from 'react';
import DesktopIcon from './DesktopIcon';

/**
 * DesktopIcons - Manages all desktop icons with their positions
 */
const DesktopIcons = ({ onOpenWindow, openWindows = [], theme }) => {
  // Desktop icons configuration with positions - now with .svg extension
  const desktopIcons = useMemo(() => [
    { 
      id: 'desktop-home', // Changed to ensure uniqueness
      name: 'Home', 
      icon: '/icons/home.svg',
      component: 'HomePage',
      position: { x: 20, y: 20 }
    },
    { 
      id: 'desktop-explore', // Changed to ensure uniqueness
      name: 'Explore', 
      icon: '/icons/explore.svg',
      component: 'ExplorePage',
      position: { x: 20, y: 100 }
    },
    { 
      id: 'desktop-messages', // Changed to ensure uniqueness
      name: 'Messages', 
      icon: '/icons/messages.svg',
      component: 'MessagesPage',
      position: { x: 20, y: 180 }
    },
    { 
      id: 'desktop-requests', // Changed to ensure uniqueness
      name: 'Requests', 
      icon: '/icons/requests.svg',
      component: 'RequestsPage',
      position: { x: 20, y: 260 }
    },
    { 
      id: 'desktop-favorites', // Changed to ensure uniqueness
      name: 'Favorites', 
      icon: '/icons/favorites.svg',
      component: 'FavoritesPage',
      position: { x: 20, y: 340 }
    },
    {
      id: 'desktop-settings', // Changed to ensure uniqueness
      name: 'Settings',
      icon: '/icons/settings.svg',
      component: 'SettingsPage',
      position: { x: 20, y: 420 }
    },
    {
      id: 'desktop-profile',
      name: 'Profile',
      icon: '/icons/profile.svg',
      component: 'ProfilePage',
      position: { x: 20, y: 500 }
    },
    {
      id: 'desktop-list-item',
      name: 'List an Item',
      icon: '/icons/add.svg',
      component: 'ListingPage',
      position: { x: 20, y: 580 }
    }
  ], []);
  
  // Check if an app is currently open (not minimized)
  const isAppActive = (id) => {
    // Extract component ID from desktop ID (remove 'desktop-' prefix)
    const componentId = id.replace('desktop-', '');
    
    return openWindows.some(window => 
      (window.id === componentId || window.id === id) && !window.minimized
    );
  };
  
  // Generate a unique window ID when opening a window
  const handleOpenWindow = (iconId, component, name) => {
    // Extract the base ID (remove 'desktop-' prefix)
    const baseId = iconId.replace('desktop-', '');
    
    // Call the parent function with the base ID
    onOpenWindow(baseId, component, name);
  };
  
  return (
    <div className="absolute inset-0">
      {desktopIcons.map((icon) => (
        <DesktopIcon
          key={icon.id}
          id={icon.id}
          name={icon.name}
          icon={icon.icon}
          position={icon.position}
          onClick={() => handleOpenWindow(icon.id, icon.component, icon.name)}
          isActive={isAppActive(icon.id)}
          theme={theme}
        />
      ))}
    </div>
  );
};

export default DesktopIcons;