'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Search, 
  ShoppingBag, 
  MessageSquare, 
  Bell, 
  User, 
  Plus,
  Compass,
  Heart,
  Settings
} from 'lucide-react';

/**
 * NavigationSidebar - Left sidebar navigation for desktop, bottom bar for mobile
 * Incorporates theme colors
 * 
 * @param {Object} props
 * @param {Object} props.theme - Theme properties (borderColor, bgColor)
 */
const NavigationSidebar = ({ theme = {} }) => {
  const pathname = usePathname();

  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  const pattern = theme?.pattern || 'none';
  
  // Function to determine text color (black or white) based on background
  const getContrastText = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light colors, white for dark
    return luminance > 0.5 ? '000000' : 'FFFFFF';
  };
  
  // Get text color based on background
  const textColor = theme?.textColor || getContrastText(bgColor);
  
  // Get active item color
  const activeItemBgColor = `#${borderColor}`;
  const activeItemTextColor = `#${getContrastText(borderColor)}`;

  const navItems = [
    { 
      name: 'Home', 
      href: '/dashboard', 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      name: 'Explore', 
      href: '/explore', 
      icon: <Compass className="h-5 w-5" /> 
    },
    { 
      name: 'Create', 
      href: '/requests/new', 
      icon: <Plus className="h-5 w-5" />,
      highlight: true // Special styling
    },
    { 
      name: 'Requests', 
      href: '/requests', 
      icon: <ShoppingBag className="h-5 w-5" /> 
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: <MessageSquare className="h-5 w-5" /> 
    },
    { 
      name: 'Favorites', 
      href: '/favorites', 
      icon: <Heart className="h-5 w-5" /> 
    },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: <Bell className="h-5 w-5" /> 
    },
    { 
      name: 'Profile', 
      href: '/profile', 
      icon: <User className="h-5 w-5" /> 
    }
  ];

  return (
    <>
      {/* Desktop Sidebar - Fixed on the left */}
      <aside 
        className="hidden md:flex flex-col w-60 p-3 fixed left-0 top-0 h-full border-r border-t border-b border-l"
        style={{ 
          backgroundColor: `#${bgColor}`,
          borderColor: `#${borderColor}`,
          color: `#${textColor}`,
          backgroundImage: pattern !== 'none' ? pattern : undefined,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center px-2 mb-6">
          <h1 
            className="text-xl font-bold"
            style={{ 
              background: `linear-gradient(135deg, #${borderColor}, #${bgColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            JapanShopper.exe
          </h1>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md border-2 transition-all",
                      isActive
                        ? "shadow-inner transform scale-[0.98]"
                        : "hover:bg-opacity-20 shadow-sm",
                    )}
                    style={{
                      backgroundColor: isActive 
                        ? activeItemBgColor 
                        : item.highlight 
                          ? `#${borderColor}80` 
                          : 'transparent',
                      color: isActive 
                        ? activeItemTextColor 
                        : item.highlight 
                          ? activeItemTextColor 
                          : `#${textColor}`,
                      borderColor: isActive || item.highlight 
                        ? `#${borderColor}` 
                        : 'transparent',
                      boxShadow: isActive 
                        ? `inset 1px 1px 3px rgba(0,0,0,0.1)` 
                        : `1px 1px 2px rgba(0,0,0,0.05)`,
                    }}
                  >
                    <span 
                      className={`${isActive ? 'opacity-100' : 'opacity-70'}`}
                      style={{ 
                        filter: isActive ? 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' : 'none'
                      }}
                    >
                      {item.icon}
                    </span>
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6">
          <Link
            href="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-opacity-10"
            style={{
              color: `#${textColor}90`,
              hoverBackgroundColor: `#${borderColor}20`,
            }}
          >
            <Settings className="h-5 w-5" />
            <span className="ml-3">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{ 
          backgroundColor: `#${bgColor}`,
          borderColor: `#${borderColor}`,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <div className="grid grid-cols-5 h-14">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center",
                )}
                style={{ 
                  color: isActive 
                    ? `#${borderColor}` 
                    : item.highlight 
                      ? activeItemTextColor 
                      : `#${textColor}80`,
                }}
              >
                {item.highlight ? (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, #${borderColor}, #${bgColor})`,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                  >
                    {item.icon}
                  </div>
                ) : (
                  <div className={isActive ? 'animate-pulse' : ''}>
                    {item.icon}
                  </div>
                )}
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default NavigationSidebar;