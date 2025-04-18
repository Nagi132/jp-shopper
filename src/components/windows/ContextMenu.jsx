'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/contexts/AppContext';
import {
  RefreshCw, Layout, Grid, List, View, 
  ArrowUpRight, FileText, FolderPlus, Scissors,
  Copy, Clipboard, Trash2, Settings, ChevronRight,
  Monitor, PaintBucket, Menu, Palette
} from 'lucide-react';

/**
 * ContextMenu - Windows 2000 style context menu system
 * 
 * Features:
 * - Different menus based on context (desktop, window, icon)
 * - Submenu support
 * - Keyboard navigation
 * - Proper positioning to avoid going off-screen
 * - Theme integration
 */
export default function ContextMenu({ 
  x, 
  y, 
  onClose, 
  context = 'desktop', 
  data = {}, 
  theme 
}) {
  const menuRef = useRef(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });
  
  const { 
    openWindow, 
    minimizeWindow, 
    closeWindow, 
    maximizeWindow, 
    restoreMaximizedWindow,
    showDesktop
  } = useApp();
  
  // Function to determine text color based on background
  const getContrastText = (hexColor) => {
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
      return '#000000'; // Default to black
    }
  };
  
  // Calculate contrasting text color for menu styling
  const textColor = theme?.textColor || getContrastText(theme?.bgColor || 'FFFFFF');
  
  // Adjust menu position to avoid going off-screen
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let adjustedX = x;
      let adjustedY = y;
      
      // Adjust horizontal position if menu goes off-screen
      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 5;
      }
      
      // Adjust vertical position if menu goes off-screen
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 5;
      }
      
      // Update position if it needs adjustment
      if (adjustedX !== adjustedPosition.x || adjustedY !== adjustedPosition.y) {
        setAdjustedPosition({ x: adjustedX, y: adjustedY });
      }
    }
  }, [x, y, adjustedPosition.x, adjustedPosition.y]);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    // Close menu on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Handle submenu hover
  const handleSubmenuHover = (submenuId, e) => {
    const itemRect = e.currentTarget.getBoundingClientRect();
    setActiveSubmenu(submenuId);
    
    // Calculate position for submenu - to the right of the parent item
    setSubmenuPosition({
      x: itemRect.right,
      y: itemRect.top
    });
  };
  
  // Close any open submenu
  const handleCloseSubmenu = () => {
    setActiveSubmenu(null);
  };
  
  // Close menu after executing an action
  const handleMenuAction = (action) => {
    // Execute the action
    action();
    // Close the menu
    onClose();
  };
  
  // Get the appropriate menu items based on context
  const getMenuItems = () => {
    switch (context) {
      case 'desktop':
        return [
          {
            id: 'view',
            label: 'View',
            icon: <View size={16} />,
            hasSubmenu: true,
            submenu: [
              { id: 'large-icons', label: 'Large Icons', icon: <Grid size={16} /> },
              { id: 'small-icons', label: 'Small Icons', icon: <Grid size={16} /> },
              { id: 'list', label: 'List', icon: <List size={16} /> },
              { id: 'details', label: 'Details', icon: <List size={16} /> },
              { type: 'separator' },
              { id: 'refresh', label: 'Refresh', icon: <RefreshCw size={16} /> },
            ]
          },
          {
            id: 'sort-by',
            label: 'Sort By',
            icon: <ArrowUpRight size={16} />,
            hasSubmenu: true,
            submenu: [
              { id: 'name', label: 'Name' },
              { id: 'size', label: 'Size' },
              { id: 'type', label: 'Type' },
              { id: 'date', label: 'Date' },
            ]
          },
          { type: 'separator' },
          {
            id: 'new',
            label: 'New',
            icon: <FolderPlus size={16} />,
            hasSubmenu: true,
            submenu: [
              { id: 'folder', label: 'Folder' },
              { id: 'shortcut', label: 'Shortcut' },
              { type: 'separator' },
              { id: 'text-document', label: 'Text Document', icon: <FileText size={16} /> },
              { id: 'bitmap-image', label: 'Bitmap Image', icon: <PaintBucket size={16} /> },
            ]
          },
          { type: 'separator' },
          { id: 'paste', label: 'Paste', icon: <Clipboard size={16} /> },
          { id: 'paste-shortcut', label: 'Paste Shortcut', icon: <Clipboard size={16} /> },
          { type: 'separator' },
          {
            id: 'personalize',
            label: 'Personalize',
            icon: <Palette size={16} />,
            action: () => openWindow('personalize', 'SettingsPage', 'Personalize')
          },
          { type: 'separator' },
          {
            id: 'properties',
            label: 'Properties',
            icon: <Settings size={16} />,
            action: () => openWindow('desktop-properties', 'SettingsPage', 'Display Properties')
          },
        ];
        
      case 'window':
        const { windowId, isMaximized } = data;
        return [
          {
            id: 'restore',
            label: 'Restore',
            disabled: !isMaximized,
            action: () => handleMenuAction(() => restoreMaximizedWindow(windowId))
          },
          {
            id: 'move',
            label: 'Move',
            disabled: isMaximized
          },
          {
            id: 'size',
            label: 'Size',
            disabled: isMaximized
          },
          {
            id: 'minimize',
            label: 'Minimize',
            action: () => handleMenuAction(() => minimizeWindow(windowId))
          },
          {
            id: 'maximize',
            label: 'Maximize',
            disabled: isMaximized,
            action: () => handleMenuAction(() => maximizeWindow(windowId))
          },
          { type: 'separator' },
          {
            id: 'close',
            label: 'Close',
            action: () => handleMenuAction(() => closeWindow(windowId))
          },
        ];
        
      case 'taskbar':
        return [
          {
            id: 'cascade-windows',
            label: 'Cascade Windows',
            icon: <Layout size={16} />
          },
          {
            id: 'tile-windows',
            label: 'Tile Windows Horizontally',
            icon: <Layout size={16} />
          },
          {
            id: 'tile-vertically',
            label: 'Tile Windows Vertically',
            icon: <Layout size={16} />
          },
          {
            id: 'show-desktop',
            label: 'Show Desktop',
            icon: <Monitor size={16} />,
            action: () => handleMenuAction(() => showDesktop())
          },
          { type: 'separator' },
          {
            id: 'task-manager',
            label: 'Task Manager',
            action: () => handleMenuAction(() => openWindow('task-manager', 'TaskManager', 'Task Manager'))
          },
          { type: 'separator' },
          {
            id: 'taskbar-properties',
            label: 'Properties',
            icon: <Settings size={16} />,
            action: () => handleMenuAction(() => openWindow('taskbar-properties', 'SettingsPage', 'Taskbar Properties'))
          },
        ];
        
      case 'desktop-icon':
        const { iconId, iconName, iconComponent } = data;
        return [
          {
            id: 'open',
            label: 'Open',
            action: () => handleMenuAction(() => openWindow(iconId, iconComponent, iconName))
          },
          { type: 'separator' },
          { id: 'cut', label: 'Cut', icon: <Scissors size={16} /> },
          { id: 'copy', label: 'Copy', icon: <Copy size={16} /> },
          { type: 'separator' },
          { id: 'delete', label: 'Delete', icon: <Trash2 size={16} /> },
          { id: 'rename', label: 'Rename' },
          { type: 'separator' },
          { id: 'properties', label: 'Properties', icon: <Settings size={16} /> },
        ];
        
      default:
        return [
          { id: 'no-actions', label: 'No Actions Available', disabled: true }
        ];
    }
  };
  
  const menuItems = getMenuItems();
  
  // Create the submenu component
  const Submenu = ({ items, position }) => {
    const submenuRef = useRef(null);
    const [adjustedPos, setAdjustedPos] = useState(position);
    
    // Adjust submenu position to avoid going off-screen
    useEffect(() => {
      if (submenuRef.current) {
        const menuRect = submenuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let newX = position.x;
        let newY = position.y;
        
        // If submenu goes off right edge, show it to the left of parent
        if (position.x + menuRect.width > viewportWidth) {
          // Position to the left of the parent menu
          newX = Math.max(0, position.x - menuRect.width - menuRef.current.offsetWidth);
        }
        
        // If submenu goes off bottom edge, adjust upward
        if (position.y + menuRect.height > viewportHeight) {
          newY = viewportHeight - menuRect.height - 5;
        }
        
        setAdjustedPos({ x: newX, y: newY });
      }
    }, [position]);
    
    return (
      <div
        ref={submenuRef}
        className="absolute bg-white border border-gray-300 shadow-md z-50 py-0.5"
        style={{
          left: adjustedPos.x,
          top: adjustedPos.y,
          minWidth: '180px'
        }}
      >
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <div 
                key={`sep-${index}`} 
                className="my-1 mx-1 border-t border-gray-300" 
              />
            );
          }
          
          return (
            <button
              key={item.id}
              className={`w-full text-left px-4 py-1 flex items-center ${
                item.disabled 
                  ? 'text-gray-400 cursor-default' 
                  : 'hover:bg-[#0A246A] hover:text-white'
              }`}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                }
              }}
              onMouseEnter={() => {
                if (item.hasSubmenu) {
                  handleSubmenuHover(item.id);
                } else {
                  handleCloseSubmenu();
                }
              }}
            >
              {item.icon && (
                <span className="w-5 h-5 mr-2 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span className="flex-grow">{item.label}</span>
              {item.hasSubmenu && <ChevronRight size={14} className="ml-2" />}
            </button>
          );
        })}
      </div>
    );
  };
  
  // Render the context menu using a portal
  return createPortal(
    <div
      ref={menuRef}
      className="absolute bg-white border border-gray-300 shadow-md z-[1000] py-0.5"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        minWidth: '180px'
      }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div 
              key={`sep-${index}`} 
              className="my-1 mx-1 border-t border-gray-300" 
            />
          );
        }
        
        return (
          <div 
            key={item.id}
            onMouseEnter={(e) => {
              if (item.hasSubmenu) {
                handleSubmenuHover(item.id, e);
              } else {
                handleCloseSubmenu();
              }
            }}
          >
            <button
              className={`w-full text-left px-4 py-1 flex items-center ${
                item.disabled 
                  ? 'text-gray-400 cursor-default' 
                  : 'hover:bg-[#0A246A] hover:text-white'
              }`}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                }
              }}
              disabled={item.disabled}
            >
              {item.icon && (
                <span className="w-5 h-5 mr-2 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span className="flex-grow">{item.label}</span>
              {item.hasSubmenu && <ChevronRight size={14} className="ml-2" />}
            </button>
            
            {/* Render submenu if active */}
            {item.hasSubmenu && activeSubmenu === item.id && (
              <Submenu 
                items={item.submenu} 
                position={submenuPosition} 
              />
            )}
          </div>
        );
      })}
    </div>,
    document.body
  );
}

/**
 * ContextMenuProvider - Provides context menu functionality to the application
 */
export function ContextMenuProvider({ children }) {
  const [contextMenu, setContextMenu] = useState(null);
  
  // Handle right click to show context menu
  const handleContextMenu = (e, context, data = {}) => {
    e.preventDefault();
    
    // Get click position
    const x = e.clientX;
    const y = e.clientY;
    
    // Set context menu data
    setContextMenu({ x, y, context, data });
  };
  
  // Close the context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };
  
  return (
    <>
      {children({ handleContextMenu })}
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          context={contextMenu.context}
          data={contextMenu.data}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}

/**
 * useContextMenu - Hook for using context menu in components
 * 
 * Usage:
 * const { showContextMenu } = useContextMenu();
 * 
 * // Then in your component:
 * <div onContextMenu={(e) => showContextMenu(e, 'custom', { data: 'value' })}>
 *   Right click me
 * </div>
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);
  
  // Show the context menu
  const showContextMenu = (e, context = 'default', data = {}) => {
    e.preventDefault();
    
    // Get click position
    const x = e.clientX;
    const y = e.clientY;
    
    // Set context menu data
    setContextMenu({ x, y, context, data });
  };
  
  // Close the context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };
  
  return {
    contextMenu,
    showContextMenu,
    closeContextMenu
  };
}