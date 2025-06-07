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
      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-inset-bottom"
        style={{ 
          backgroundColor: `#${bgColor}`,
          borderColor: `#${borderColor}`,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <div className="grid grid-cols-5 h-16 pb-safe">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center p-1",
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
                    className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
                    style={{ 
                      background: `linear-gradient(135deg, #${borderColor}, #${bgColor})`,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span className="text-sm">{item.icon}</span>
                  </div>
                ) : (
                  <div className={`mb-1 ${isActive ? 'animate-pulse' : ''}`}>
                    {item.icon}
                  </div>
                )}
                <span className="text-xs text-center leading-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default NavigationSidebar;