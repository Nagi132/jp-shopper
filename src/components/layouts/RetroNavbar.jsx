'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Settings, LogOut, ChevronDown, User, Package, MessageSquare, Search, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

/**
 * RetroNavbar - Y2K/Retro style navbar that changes with theme
 * 
 * @param {Object} props
 * @param {Object} props.theme - Theme properties (borderColor, bgColor, textColor)
 */
export default function RetroNavbar({ theme = {} }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Get theme colors or use defaults
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  const textColor = theme?.textColor || '000000';
  
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
  
  // Derived colors
  const menuBgColor = bgColor;
  const menuTextColor = textColor || getContrastText(bgColor);
  const marqueeColor = borderColor;
  const menuActiveBgColor = borderColor;
  const menuActiveTextColor = getContrastText(borderColor);
  
  // Detect active link
  const isActive = (path) => pathname === path;
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Marquee Banner - Optional but adds to the Y2K aesthetic */}
      <div 
        className="overflow-hidden w-full"
        style={{ 
          backgroundColor: `#${marqueeColor}`, 
          borderBottom: `1px solid #${borderColor}`
        }}
      >
        <div className="py-1 animate-marquee whitespace-nowrap">
          <span 
            className="inline-block mx-4 font-bold"
            style={{ color: `#${getContrastText(marqueeColor)}` }}
          >
            ⭐ Find Exclusive Items from Japan
          </span>
          <span 
            className="inline-block mx-4 font-bold"
            style={{ color: `#${getContrastText(marqueeColor)}` }}
          >
            ✨ Free Shipping on Orders Over ¥5000
          </span>
          <span 
            className="inline-block mx-4 font-bold"
            style={{ color: `#${getContrastText(marqueeColor)}` }}
          >
            🎮 Rare Collectibles Available Now!
          </span>
          <span 
            className="inline-block mx-4 font-bold"
            style={{ color: `#${getContrastText(marqueeColor)}` }}
          >
            💫 Limited Time Offers
          </span>
        </div>
      </div>
      
      {/* Main Navbar */}
      <header 
        className="border-b shadow-sm"
        style={{ 
          backgroundColor: `#${bgColor}`,
          borderColor: `#${borderColor}`
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Top Menu Bar */}
          <div 
            className="h-8 flex items-center border-b px-2"
            style={{ borderColor: `#${borderColor}40` }} // Transparent version
          >
            <Link 
              href="/dashboard" 
              className="flex-shrink-0 flex items-center px-2 mr-4"
            >
              <span 
                className="text-lg font-bold"
                style={{ color: `#${menuTextColor}` }}
              >
                JapanShopper.exe
              </span>
            </Link>
            
            {/* Windows-style Menu */}
            <div className="relative">
              <button 
                className={`px-4 py-0.5 font-medium text-sm ${
                  dropdownOpen ? 'text-white' : 'hover:bg-white hover:bg-opacity-20'
                }`}
                style={{ 
                  backgroundColor: dropdownOpen ? `#${menuActiveBgColor}` : 'transparent',
                  color: dropdownOpen ? `#${menuActiveTextColor}` : `#${menuTextColor}`
                }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                File
              </button>
              
              {dropdownOpen && (
                <div 
                  className="absolute top-full left-0 mt-0.5 border-2 shadow-md w-48 z-50"
                  style={{ 
                    backgroundColor: `#${bgColor}`,
                    borderColor: `#${borderColor}`,
                    boxShadow: `3px 3px 0 rgba(0,0,0,0.2)`
                  }}
                >
                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-2 border-b hover:text-white"
                    style={{ 
                      borderColor: `#${borderColor}40`,
                      color: `#${menuTextColor}`,
                      ":hover": { backgroundColor: `#${menuActiveBgColor}` }
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/requests/new" 
                    className="block px-4 py-2 border-b hover:text-white"
                    style={{ 
                      borderColor: `#${borderColor}40`,
                      color: `#${menuTextColor}`,
                      ":hover": { backgroundColor: `#${menuActiveBgColor}` }
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    New Request
                  </Link>
                  <Link 
                    href="/explore" 
                    className="block px-4 py-2 border-b hover:text-white"
                    style={{ 
                      borderColor: `#${borderColor}40`,
                      color: `#${menuTextColor}`,
                      ":hover": { backgroundColor: `#${menuActiveBgColor}` }
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Explore
                  </Link>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left px-4 py-2 hover:text-white"
                    style={{ 
                      color: `#${menuTextColor}`,
                      ":hover": { backgroundColor: `#${menuActiveBgColor}` }
                    }}
                  >
                    Exit
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button 
                className="px-4 py-0.5 font-medium text-sm hover:bg-white hover:bg-opacity-20"
                style={{ color: `#${menuTextColor}` }}
              >
                View
              </button>
            </div>
            
            <div className="relative">
              <button 
                className="px-4 py-0.5 font-medium text-sm hover:bg-white hover:bg-opacity-20"
                style={{ color: `#${menuTextColor}` }}
              >
                Help
              </button>
            </div>
          </div>
          
          {/* Main Navigation Toolbar */}
          <div 
            className="py-1 px-3 flex justify-between items-center border-b"
            style={{ 
              backgroundColor: `#${bgColor}`, 
              borderColor: `#${borderColor}40`
            }}
          >
            {/* Left Side Navigation Icons */}
            <div className="flex items-center space-x-1">
              <NavButton 
                href="/dashboard" 
                active={isActive('/dashboard')}
                activeColor={menuActiveBgColor}
                activeTextColor={menuActiveTextColor}
                textColor={menuTextColor}
              >
                <ShoppingBag className="w-4 h-4 mr-1" />
                <span>Shop</span>
              </NavButton>
              
              <NavButton 
                href="/requests" 
                active={isActive('/requests')}
                activeColor={menuActiveBgColor}
                activeTextColor={menuActiveTextColor}
                textColor={menuTextColor}
              >
                <Package className="w-4 h-4 mr-1" />
                <span>Requests</span>
              </NavButton>
              
              <NavButton 
                href="/messages" 
                active={isActive('/messages')}
                activeColor={menuActiveBgColor}
                activeTextColor={menuActiveTextColor}
                textColor={menuTextColor}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                <span>Messages</span>
              </NavButton>
              
              <NavButton 
                href="/explore" 
                active={isActive('/explore')}
                activeColor={menuActiveBgColor}
                activeTextColor={menuActiveTextColor}
                textColor={menuTextColor}
              >
                <Search className="w-4 h-4 mr-1" />
                <span>Explore</span>
              </NavButton>
            </div>
            
            {/* Right Side User Menu */}
            <div className="flex items-center">
              <NavButton 
                as="button" 
                onClick={() => {}}
                textColor={menuTextColor}
              >
                <Bell className="w-4 h-4" />
              </NavButton>
              
              <div className="relative">
                <button
                  className="flex items-center justify-center px-3 h-8 text-sm border-2"
                  style={{ 
                    borderColor: userDropdownOpen ? `#${menuActiveBgColor}` : `#${borderColor}`,
                    backgroundColor: userDropdownOpen ? `#${menuActiveBgColor}20` : 'transparent',
                    color: userDropdownOpen ? `#${menuActiveTextColor}` : `#${menuTextColor}`
                  }}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <User className="w-4 h-4 mr-1" />
                  <span>Profile</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-0.5 w-48 shadow-md z-50 border-2"
                    style={{ 
                      backgroundColor: `#${bgColor}`,
                      borderColor: `#${borderColor}`,
                      boxShadow: `3px 3px 0 rgba(0,0,0,0.2)`
                    }}
                  >
                    <Link 
                      href="/profile" 
                      className="flex items-center px-4 py-2 border-b hover:text-white"
                      style={{ 
                        borderColor: `#${borderColor}40`,
                        color: `#${menuTextColor}`
                      }}
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                    <Link 
                      href="/settings" 
                      className="flex items-center px-4 py-2 border-b hover:text-white"
                      style={{ 
                        borderColor: `#${borderColor}40`,
                        color: `#${menuTextColor}`
                      }}
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="flex items-center w-full text-left px-4 py-2 hover:text-white"
                      style={{ color: `#${menuTextColor}` }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

// Reusable Retro Navigation Button component
function NavButton({ children, href, active = false, as = 'a', onClick, activeColor, activeTextColor, textColor }) {
  const Component = as;
  
  const sharedProps = {
    className: `flex items-center justify-center px-3 h-8 text-sm border-2 ${
      active ? 'font-medium' : ''
    }`,
    style: { 
      borderColor: active ? '#00000040' : 'transparent',
      backgroundColor: active ? `#${activeColor}` : 'transparent',
      color: active ? `#${activeTextColor}` : `#${textColor}`,
    },
    onClick
  };
  
  if (as === 'a') {
    return (
      <Link href={href} {...sharedProps}>
        {children}
      </Link>
    );
  }
  
  return (
    <Component {...sharedProps}>
      {children}
    </Component>
  );
}