// src/components/windows/DesktopIcons.jsx
'use client';

import React from 'react';
import DesktopIcon from './DesktopIcon';

/**
 * DesktopIcons - Manages all desktop icons with their positions
 */
const DesktopIcons = ({ onOpenWindow, openWindows = [], theme }) => {
  // Desktop icons configuration with positions - now with .svg extension
  const desktopIcons = [
    { 
      id: 'home', 
      name: 'Home', 
      icon: '/icons/home.svg', // Changed from .png to .svg
      component: 'HomePage',
      position: { x: 20, y: 20 }
    },
    { 
      id: 'explore', 
      name: 'Explore', 
      icon: '/icons/explore.svg', // Changed from .png to .svg
      component: 'ExplorePage',
      position: { x: 20, y: 100 }
    },
    { 
      id: 'messages', 
      name: 'Messages', 
      icon: '/icons/messages.svg', // Changed from .png to .svg
      component: 'MessagesPage',
      position: { x: 20, y: 180 }
    },
    { 
      id: 'requests', 
      name: 'Requests', 
      icon: '/icons/requests.svg', // Changed from .png to .svg
      component: 'RequestsPage',
      position: { x: 20, y: 260 }
    },
    { 
      id: 'favorites', 
      name: 'Favorites', 
      icon: '/icons/favorites.svg', // Changed from .png to .svg
      component: 'FavoritesPage',
      position: { x: 20, y: 340 }
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: '/icons/default.svg', // Using default since you don't have settings.svg
      component: 'SettingsPage',
      position: { x: 20, y: 420 }
    }
  ];
  
  // Check if an app is currently open (not minimized)
  const isAppActive = (id) => {
    return openWindows.some(window => 
      window.id === id && !window.minimized
    );
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
          onClick={() => onOpenWindow(icon.id, icon.component, icon.name)}
          isActive={isAppActive(icon.id)}
          theme={theme}
        />
      ))}
    </div>
  );
};

export default DesktopIcons;