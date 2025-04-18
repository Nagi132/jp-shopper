'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { 
  Home, Search, MessageSquare, User, ShoppingBag, Heart, 
  Bell, Settings, LogOut, HelpCircle, Calendar, FileText,
  Upload, Monitor, ChevronRight, Clock, ExternalLink, Terminal,
  Laptop, Globe, PaintBucket, Mail, Music, Printer, FolderOpen,
  Power, LayoutGrid, PieChart, Book, Info
} from 'lucide-react';

/**
 * Enhanced Windows 2000 Style Start Menu with submenus
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Function to close the menu
 * @param {Function} props.onOpenWindow - Function to open a window
 * @param {Object} props.theme - Theme colors
 * @param {string} props.username - Username to display (optional)
 */
const StartMenu = ({ onClose, onOpenWindow, theme, username = 'User' }) => {
  const [recentItems, setRecentItems] = useState([]);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [expandedSubmenuPath, setExpandedSubmenuPath] = useState([]);
  const [pendingSubmenu, setPendingSubmenu] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();
  const submenuTimerRef = useRef(null);
  
  // Calculate contrasting text color
  const getContrastColor = (hexColor) => {
    if (!hexColor) return '#000000';
    
    try {
      const r = parseInt(hexColor.substring(0, 2), 16);
      const g = parseInt(hexColor.substring(2, 2), 16);
      const b = parseInt(hexColor.substring(4, 2), 16);
      
      // Calculate luminance - simplified formula
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return white for dark colors, black for light
      return luminance > 0.5 ? '#000000' : '#FFFFFF';
    } catch (err) {
      return '#000000'; // Default to black on error
    }
  };
  
  // Load recent items from localStorage
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('recentItems');
      if (savedItems) {
        setRecentItems(JSON.parse(savedItems));
      } else {
        // Default items
        setRecentItems([
          { id: 'explore', title: 'Explore', component: 'ExplorePage', icon: <Search size={16} /> },
          { id: 'requests', title: 'Requests', component: 'RequestsPage', icon: <ShoppingBag size={16} /> },
          { id: 'messages', title: 'Messages', component: 'MessagesPage', icon: <MessageSquare size={16} /> }
        ]);
      }
    } catch (error) {
      console.error('Error loading recent items:', error);
    }
  }, []);
  
  // Setup delayed submenu handlers
  useEffect(() => {
    if (pendingSubmenu) {
      // Clear any existing timer
      if (submenuTimerRef.current) {
        clearTimeout(submenuTimerRef.current);
      }
      
      // Set a new timer to open the submenu after a short delay
      submenuTimerRef.current = setTimeout(() => {
        setActiveSubmenu(pendingSubmenu);
        setPendingSubmenu(null);
      }, 200); // 200ms delay
    }
    
    return () => {
      if (submenuTimerRef.current) {
        clearTimeout(submenuTimerRef.current);
      }
    };
  }, [pendingSubmenu]);
  
  // Handle document click to close the menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e) => {
      // Check if click was outside the menu
      if (!e.target.closest('.start-menu')) {
        onClose();
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [onClose]);
  
  // Define main menu items
  const mainMenuItems = [
    // Programs menu (with submenu)
    {
      id: 'programs',
      label: 'Programs',
      icon: <LayoutGrid size={16} />,
      hasSubmenu: true,
      submenuItems: [
        { id: 'internet', label: 'Internet Explorer', icon: <Globe size={16} />, component: 'InternetExplorer' },
        { id: 'email', label: 'Outlook Express', icon: <Mail size={16} />, component: 'Email' },
        { id: 'paint', label: 'Paint', icon: <PaintBucket size={16} />, component: 'Paint' },
        { id: 'notepad', label: 'Notepad', icon: <FileText size={16} />, component: 'Notepad' },
        { id: 'media-player', label: 'Windows Media Player', icon: <Music size={16} />, component: 'MediaPlayer' },
        {
          id: 'games',
          label: 'Games',
          icon: <Laptop size={16} />,
          hasSubmenu: true,
          submenuItems: [
            { id: 'minesweeper', label: 'Minesweeper', component: 'Minesweeper' },
            { id: 'solitaire', label: 'Solitaire', component: 'Solitaire' }
          ]
        },
        { 
          id: 'accessories',
          label: 'Accessories',
          icon: <FolderOpen size={16} />,
          hasSubmenu: true,
          submenuItems: [
            { id: 'calculator', label: 'Calculator', component: 'Calculator' },
            { id: 'command-prompt', label: 'Command Prompt', icon: <Terminal size={16} />, component: 'CommandPrompt' }
          ]
        }
      ]
    },
    
    // JapanShopper apps
    { id: 'home', label: 'Home', icon: <Home size={16} />, component: 'HomePage' },
    { id: 'explore', label: 'Explore', icon: <Search size={16} />, component: 'ExplorePage' },
    { id: 'requests', label: 'Requests', icon: <ShoppingBag size={16} />, component: 'RequestsPage' },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={16} />, component: 'MessagesPage' },
    { id: 'favorites', label: 'Favorites', icon: <Heart size={16} />, component: 'FavoritesPage' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />, component: 'NotificationsPage' },
    
    // Divider
    { type: 'divider' },
    
    // Documents (with submenu for recent documents)
    {
      id: 'documents',
      label: 'Documents',
      icon: <Book size={16} />,
      hasSubmenu: true,
      submenuItems: [
        { id: 'doc-1', label: 'Recent Document 1', icon: <FileText size={16} /> },
        { id: 'doc-2', label: 'Recent Document 2', icon: <FileText size={16} /> },
        { id: 'doc-3', label: 'Recent Document 3', icon: <FileText size={16} /> }
      ]
    },
    
    // Settings
    { 
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={16} />,
      hasSubmenu: true,
      submenuItems: [
        { id: 'control-panel', label: 'Control Panel', icon: <LayoutGrid size={16} />, component: 'ControlPanel' },
        { id: 'printers', label: 'Printers', icon: <Printer size={16} />, component: 'Printers' },
        { id: 'network', label: 'Network Connections', icon: <Globe size={16} />, component: 'Network' },
        { id: 'taskbar', label: 'Taskbar & Start Menu', icon: <LayoutGrid size={16} />, component: 'TaskbarSettings' }
      ]
    },
    
    // Help
    { id: 'help', label: 'Help', icon: <HelpCircle size={16} />, component: 'HelpPage' },
    { id: 'search', label: 'Search', icon: <Search size={16} />, component: 'SearchPage' },
    { id: 'run', label: 'Run...', icon: <ExternalLink size={16} />, component: 'RunWindow' },
    
    // Divider
    { type: 'divider' },
    
    // Logout and shutdown
    { id: 'logout', label: 'Log Out', icon: <LogOut size={16} />, action: 'logout' },
    { id: 'shutdown', label: 'Shut Down...', icon: <Power size={16} />, action: 'shutdown' }
  ];
  
  // Handle opening a window and tracking recent items
  const handleOpenWindow = (id, component, title) => {
    // Add to recent items (if not already there)
    if (id && component && title) {
      const newRecentItems = recentItems.filter(item => item.id !== id);
      newRecentItems.unshift({ id, title, component });
      
      // Keep only the most recent 6 items
      if (newRecentItems.length > 6) {
        newRecentItems.pop();
      }
      
      setRecentItems(newRecentItems);
      
      // Save to localStorage
      try {
        localStorage.setItem('recentItems', JSON.stringify(newRecentItems));
      } catch (error) {
        console.error('Error saving recent items:', error);
      }
    }
    
    // Open the window
    if (id && component) {
      onOpenWindow(id, component, title || id);
      onClose();
    }
  };
  
  // Handle logout action
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    onClose();
  };
  
  // Handle shutdown action
  const handleShutdown = () => {
    // Show classic Windows shutdown dialog
    if (confirm('Are you sure you want to shut down?')) {
      // Simulate shutdown with a fun message
      const shutdownScreen = document.createElement('div');
      shutdownScreen.style.position = 'fixed';
      shutdownScreen.style.inset = '0';
      shutdownScreen.style.backgroundColor = '#000080';
      shutdownScreen.style.color = 'white';
      shutdownScreen.style.display = 'flex';
      shutdownScreen.style.flexDirection = 'column';
      shutdownScreen.style.alignItems = 'center';
      shutdownScreen.style.justifyContent = 'center';
      shutdownScreen.style.zIndex = '9999';
      shutdownScreen.style.fontFamily = 'Courier New, monospace';
      shutdownScreen.innerHTML = `
        <div style="text-align: center;">
          <h2>It is now safe to turn off your computer.</h2>
          <p style="margin-top: 20px">(Just kidding! This is just the Windows 2000 shutdown screen)</p>
          <button style="margin-top: 30px; padding: 5px 10px; background: #d4d0c8; border: 2px solid #404040; cursor: pointer;">
            Restart
          </button>
        </div>
      `;
      document.body.appendChild(shutdownScreen);
      
      // Add click event to "restart" button
      const restartButton = shutdownScreen.querySelector('button');
      restartButton.addEventListener('click', () => {
        document.body.removeChild(shutdownScreen);
      });
    }
    
    onClose();
  };
  
  // Handle item click based on type
  const handleItemClick = (item) => {
    if (item.hasSubmenu) {
      // Toggle submenu
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else if (item.component) {
      // Open window
      handleOpenWindow(item.id, item.component, item.label);
    } else if (item.action === 'logout') {
      handleLogout();
    } else if (item.action === 'shutdown') {
      handleShutdown();
    }
  };
  
  // Handle hovering on an item with a submenu
  const handleItemHover = (item) => {
    // If item has a submenu, queue it to open after a delay
    if (item.hasSubmenu) {
      setPendingSubmenu(item.id);
    } else {
      // If hovering over an item without a submenu, close any open submenu
      setPendingSubmenu(null);
    }
  };
  
  // Handle mouseleave on entire menu
  const handleMenuMouseLeave = () => {
    setPendingSubmenu(null);
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
    }
  };
  
  // Find submenu items for the active submenu
  const getSubmenuItems = (menuId) => {
    const findSubmenu = (items, id) => {
      for (const item of items) {
        if (item.id === id && item.hasSubmenu) {
          return item.submenuItems || [];
        }
        
        if (item.hasSubmenu && item.submenuItems) {
          const submenu = findSubmenu(item.submenuItems, id);
          if (submenu.length > 0) return submenu;
        }
      }
      return [];
    };
    
    return findSubmenu(mainMenuItems, menuId);
  };
  
  // Get submenu position
  const getSubmenuPosition = (menuId) => {
    // Find all parent submenus
    const findParentChain = (items, targetId, chain = []) => {
      for (const item of items) {
        if (item.id === targetId) {
          return [...chain, item.id];
        }
        
        if (item.hasSubmenu && item.submenuItems) {
          const result = findParentChain(item.submenuItems, targetId, [...chain, item.id]);
          if (result.length > 0) return result;
        }
      }
      return [];
    };
    
    const parentChain = findParentChain(mainMenuItems, menuId);
    
    // Return right position for nested submenus, top for first level
    return parentChain.length > 1 ? 'right' : 'right-top';
  };
  
  return (
    <div 
      className="start-menu absolute bottom-10 left-0 z-50 flex overflow-hidden shadow-[4px_4px_10px_rgba(0,0,0,0.3)]"
      onMouseLeave={handleMenuMouseLeave}
    >
      {/* Left banner with logo and username */}
      <div 
        className="w-60 h-full py-4 flex flex-col"
        style={{
          background: `linear-gradient(135deg, #${theme.borderColor}, #${theme.bgColor})`,
          color: getContrastColor(theme.borderColor),
          borderRight: `1px solid #${theme.borderColor}80`,
        }}
      >
        <div className="flex items-center px-4 mb-6">
          <div 
            className="w-12 h-12 flex items-center justify-center rounded-full mr-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            <User size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-xl text-white">{username}</h3>
            <p className="text-xs opacity-80 text-white">JapanShopper</p>
          </div>
        </div>
        
        {/* Recent items section */}
        {recentItems.length > 0 && (
          <div className="px-4 mb-4">
            <h4 className="text-xs font-bold uppercase mb-2 text-white/70">Recent Items</h4>
            <div className="space-y-1">
              {recentItems.slice(0, 6).map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center px-2 py-1 text-white text-xs hover:bg-white/20 rounded-sm text-left transition-colors"
                  onClick={() => handleOpenWindow(item.id, item.component || 'HomePage', item.title)}
                >
                  <Clock size={14} className="mr-2" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Internet section */}
        <div className="px-4 mt-auto">
          <h4 className="text-xs font-bold uppercase mb-2 text-white/70">Internet</h4>
          <div className="space-y-1">
            <button
              className="w-full flex items-center px-2 py-1 text-white text-xs hover:bg-white/20 rounded-sm text-left transition-colors"
              onClick={() => handleOpenWindow('browser', 'InternetExplorer', 'Internet Explorer')}
            >
              <Globe size={14} className="mr-2" />
              <span>Internet Explorer</span>
            </button>
            <button
              className="w-full flex items-center px-2 py-1 text-white text-xs hover:bg-white/20 rounded-sm text-left transition-colors"
              onClick={() => handleOpenWindow('email', 'Email', 'Outlook Express')}
            >
              <Mail size={14} className="mr-2" />
              <span>Outlook Express</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Right side - main menu */}
      <div 
        className="w-60 max-h-[500px] overflow-y-auto"
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: `2px solid #${theme.borderColor}`,
          borderRight: `2px solid #${theme.borderColor}`,
          borderBottom: `2px solid #${theme.borderColor}`,
        }}
      >
        <div className="py-2">
          {mainMenuItems.map((item, index) => {
            if (item.type === 'divider') {
              return (
                <div 
                  key={`divider-${index}`} 
                  className="mx-2 my-1 border-t" 
                  style={{ borderColor: '#d4d0c8' }}
                ></div>
              );
            }
            
            const isHighlighted = activeSubmenu === item.id || pendingSubmenu === item.id;
            
            return (
              <div 
                key={item.id} 
                className="relative"
                onMouseEnter={() => handleItemHover(item)}
              >
                <button
                  className={`w-full flex items-center justify-between px-4 py-1.5 text-left text-sm ${
                    isHighlighted ? 'bg-[#0A246A] text-white' : 'text-black hover:bg-[#d4d0c8]'
                  }`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center">
                    <span className="w-6 h-6 flex items-center justify-center mr-2 text-inherit">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  
                  {item.hasSubmenu && (
                    <ChevronRight size={14} className={isHighlighted ? 'text-white' : 'text-gray-500'} />
                  )}
                </button>
                
                {/* Submenu */}
                {item.hasSubmenu && activeSubmenu === item.id && (
                  <SubmenuPanel
                    items={getSubmenuItems(item.id)}
                    position={getSubmenuPosition(item.id)}
                    onItemClick={handleItemClick}
                    onItemHover={handleItemHover}
                    theme={theme}
                    parentItem={item}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Submenu Panel Component
const SubmenuPanel = ({ 
  items, 
  position = 'right-top', 
  onItemClick, 
  onItemHover,
  theme,
  parentItem
}) => {
  const submenuStyles = {
    right: {
      // Position to the right of parent menu
      position: 'absolute',
      top: '0',
      left: '100%',
      marginLeft: '2px',
    },
    'right-top': {
      // Position to the right of parent with top alignment
      position: 'absolute',
      top: '0',
      left: '100%',
      marginLeft: '2px',
    }
  };
  
  return (
    <div 
      className="w-56 py-1 border-2 shadow-md z-50 bg-white"
      style={{
        ...submenuStyles[position],
        borderColor: theme ? `#${theme.borderColor}` : '#a0a0a0',
        animation: 'fadeIn 0.1s ease-in-out',
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      
      {items.map((item, index) => {
        if (item.type === 'divider') {
          return (
            <div 
              key={`divider-${index}`} 
              className="mx-2 my-1 border-t" 
              style={{ borderColor: '#d4d0c8' }}
            ></div>
          );
        }
        
        return (
          <div 
            key={item.id} 
            className="relative"
            onMouseEnter={() => onItemHover(item)}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-1.5 text-sm text-left hover:bg-[#0A246A] hover:text-white"
              onClick={() => onItemClick(item)}
            >
              <div className="flex items-center">
                <span className="w-6 h-6 flex items-center justify-center mr-2">
                  {item.icon || <div className="w-4 h-4 rounded-sm bg-gray-200"></div>}
                </span>
                <span>{item.label}</span>
              </div>
              
              {item.hasSubmenu && (
                <ChevronRight size={14} className="text-gray-500" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default StartMenu;