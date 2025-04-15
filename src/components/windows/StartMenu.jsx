'use client';

import React from 'react';
import {
  Home,
  Search,
  MessageSquare,
  User,
  ShoppingBag,
  Heart,
  Bell,
  Settings,
  LogOut,
  HelpCircle,
  Calendar,
  FileText,
  Upload,
  Monitor
} from 'lucide-react';

/**
 * StartMenu - A Windows 2000 style Start Menu
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the menu
 * @param {Function} props.onOpenWindow - Function to open a window
 * @param {Object} props.theme - Theme colors
 */
const StartMenu = ({ onClose, onOpenWindow, theme }) => {
  // Handle logout
  const handleLogout = () => {
    // Close the start menu
    onClose();
    
    // In a real app, you would implement logout functionality here
    if (typeof window !== 'undefined') {
      alert('You are about to log out. This would normally redirect to the login page.');
    }
  };
  
  return (
    <div 
      className="start-menu absolute bottom-10 left-0 z-50 w-64 overflow-hidden"
      style={{
        backgroundColor: `#${theme.bgColor}`,
        border: `2px solid #${theme.borderColor}`,
        borderRadius: '3px',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      {/* Start Menu Header */}
      <div 
        className="h-16 flex items-center justify-start px-4"
        style={{
          backgroundImage: `linear-gradient(135deg, #${theme.borderColor}, #${theme.bgColor})`,
          borderBottom: `1px solid #${theme.borderColor}80`,
        }}
      >
        <div 
          className="w-8 h-8 flex items-center justify-center mr-3 rounded-full"
          style={{
            backgroundColor: `#${theme.borderColor}50`,
            border: `1px solid #${theme.borderColor}80`,
          }}
        >
          <User size={20} color="#FFFFFF" />
        </div>
        <div className="text-white">
          <div className="font-bold text-lg">JapanShopper</div>
          <div className="text-xs opacity-80">User</div>
        </div>
      </div>
      
      {/* Menu Content */}
      <div className="flex">
        {/* Main menu column */}
        <div className="flex-1">
          <StartMenuItem
            icon={<Home size={16} />}
            label="Home"
            onClick={() => {
              onOpenWindow('home', 'HomePage', 'Home');
              onClose();
            }}
            theme={theme}
          />
          <StartMenuItem
            icon={<Search size={16} />}
            label="Explore"
            onClick={() => {
              onOpenWindow('explore', 'ExplorePage', 'Explore');
              onClose();
            }}
            theme={theme}
          />
          <StartMenuItem
            icon={<MessageSquare size={16} />}
            label="Messages"
            onClick={() => {
              onOpenWindow('messages', 'MessagesPage', 'Messages');
              onClose();
            }}
            theme={theme}
          />
          <StartMenuItem
            icon={<ShoppingBag size={16} />}
            label="Requests"
            onClick={() => {
              onOpenWindow('requests', 'RequestsPage', 'Requests');
              onClose();
            }}
            theme={theme}
          />
          <StartMenuItem
            icon={<Heart size={16} />}
            label="Favorites"
            onClick={() => {
              onOpenWindow('favorites', 'FavoritesPage', 'Favorites');
              onClose();
            }}
            theme={theme}
          />
          <StartMenuItem
            icon={<Bell size={16} />}
            label="Notifications"
            onClick={() => {
              onOpenWindow('notifications', 'NotificationsPage', 'Notifications');
              onClose();
            }}
            theme={theme}
          />
          
          {/* Divider */}
          <div 
            className="mx-2 my-1 border-t" 
            style={{ borderColor: `#${theme.borderColor}40` }}
          ></div>
          
          <StartMenuItem
            icon={<Settings size={16} />}
            label="Settings"
            onClick={() => {
              onOpenWindow('settings', 'SettingsPage', 'Settings');
              onClose();
            }}
            theme={theme}
          />
          <StartMenuItem
            icon={<HelpCircle size={16} />}
            label="Help"
            onClick={() => {
              onOpenWindow('help', 'HelpPage', 'Help');
              onClose();
            }}
            theme={theme}
          />
          <StartMenuItem
            icon={<LogOut size={16} />}
            label="Log Out"
            onClick={handleLogout}
            theme={theme}
          />
        </div>
        
        {/* Secondary menu column with system items */}
        <div
          className="w-12 py-1"
          style={{ backgroundColor: `#${theme.borderColor}20` }}
        >
          <div className="flex flex-col items-center space-y-4 pt-2">
            <IconButton
              icon={<Calendar size={20} />}
              theme={theme}
              onClick={() => {}}
            />
            <IconButton
              icon={<FileText size={20} />}
              theme={theme}
              onClick={() => {}}
            />
            <IconButton
              icon={<Upload size={20} />}
              theme={theme}
              onClick={() => {}}
            />
            <IconButton
              icon={<Monitor size={20} />}
              theme={theme}
              onClick={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Start menu item component
const StartMenuItem = ({ icon, label, onClick, theme }) => {
  return (
    <button 
      className="w-full flex items-center px-4 py-2 text-sm hover:bg-white hover:bg-opacity-20 text-left"
      onClick={onClick}
      style={{ color: `#${theme.textColor || '000000'}` }}
    >
      <span className="w-5 h-5 flex items-center justify-center mr-3" style={{ color: `#${theme.borderColor}` }}>
        {icon}
      </span>
      {label}
    </button>
  );
};

// Icon button component for the secondary menu
const IconButton = ({ icon, onClick, theme }) => {
  return (
    <button
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20"
      onClick={onClick}
      style={{ color: `#${theme.borderColor}` }}
    >
      {icon}
    </button>
  );
};

export default StartMenu;