'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Settings, LogOut, ChevronDown, User, Package, MessageSquare, Search, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function RetroNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Detect active link
  const isActive = (path) => pathname === path;
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Marquee Banner - Optional but adds to the Y2K aesthetic */}
      <div className="bg-[#00FFFF] border-b border-[#00CCCC] overflow-hidden w-full">
        <div className="py-1 animate-marquee whitespace-nowrap">
          <span className="inline-block mx-4 text-black font-bold">⭐ Find Exclusive Items from Japan</span>
          <span className="inline-block mx-4 text-black font-bold">✨ Free Shipping on Orders Over ¥5000</span>
          <span className="inline-block mx-4 text-black font-bold">🎮 Rare Collectibles Available Now!</span>
          <span className="inline-block mx-4 text-black font-bold">💫 Limited Time Offers</span>
        </div>
      </div>
      
      {/* Main Navbar */}
      <header className="bg-[#C0C0C0] border-b border-gray-400 shadow-sm">
        <div className="max-w-7xl mx-auto">
          {/* Top Menu Bar */}
          <div className="h-8 flex items-center border-b border-gray-400 px-2">
            <Link 
              href="/dashboard" 
              className="flex-shrink-0 flex items-center px-2 mr-4"
            >
              <span className="text-lg font-bold text-black">JapanShopper.exe</span>
            </Link>
            
            {/* Windows-style Menu */}
            <div className="relative">
              <button 
                className={`px-4 py-0.5 font-medium text-sm ${dropdownOpen ? 'bg-[#C999F8] text-white' : 'hover:bg-gray-300'}`} 
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                File
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-0.5 bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-md w-48 z-50">
                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-2 hover:bg-[#C999F8] hover:text-white border-b border-gray-400"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/requests/new" 
                    className="block px-4 py-2 hover:bg-[#C999F8] hover:text-white border-b border-gray-400"
                    onClick={() => setDropdownOpen(false)}
                  >
                    New Request
                  </Link>
                  <Link 
                    href="/explore" 
                    className="block px-4 py-2 hover:bg-[#C999F8] hover:text-white border-b border-gray-400"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Explore
                  </Link>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      handleSignOut();
                    }} 
                    className="block w-full text-left px-4 py-2 hover:bg-[#C999F8] hover:text-white"
                  >
                    Exit
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button 
                className="px-4 py-0.5 font-medium text-sm hover:bg-gray-300"
              >
                View
              </button>
            </div>
            
            <div className="relative">
              <button 
                className="px-4 py-0.5 font-medium text-sm hover:bg-gray-300"
              >
                Help
              </button>
            </div>
          </div>
          
          {/* Main Navigation Toolbar */}
          <div className="py-1 px-3 flex justify-between items-center bg-[#C0C0C0] border-b border-gray-400">
            {/* Left Side Navigation Icons */}
            <div className="flex items-center space-x-1">
              <NavButton href="/dashboard" active={isActive('/dashboard')}>
                <ShoppingBag className="w-4 h-4 mr-1" />
                <span>Shop</span>
              </NavButton>
              
              <NavButton href="/requests" active={isActive('/requests')}>
                <Package className="w-4 h-4 mr-1" />
                <span>Requests</span>
              </NavButton>
              
              <NavButton href="/messages" active={isActive('/messages')}>
                <MessageSquare className="w-4 h-4 mr-1" />
                <span>Messages</span>
              </NavButton>
              
              <NavButton href="/explore" active={isActive('/explore')}>
                <Search className="w-4 h-4 mr-1" />
                <span>Explore</span>
              </NavButton>
            </div>
            
            {/* Right Side User Menu */}
            <div className="flex items-center">
              <NavButton as="button" onClick={() => {}}>
                <Bell className="w-4 h-4" />
              </NavButton>
              
              <div className="relative">
                <button
                  className={`flex items-center justify-center px-3 h-8 text-sm border-2 ${
                    userDropdownOpen 
                      ? 'border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-gray-300' 
                      : 'border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#C0C0C0] hover:bg-gray-300'
                  }`}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <User className="w-4 h-4 mr-1" />
                  <span>Profile</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-0.5 w-48 bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-md z-50">
                    <Link 
                      href="/profile" 
                      className="flex items-center px-4 py-2 hover:bg-[#C999F8] hover:text-white border-b border-gray-400"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      My Profile
                    </Link>
                    <Link 
                      href="/settings" 
                      className="flex items-center px-4 py-2 hover:bg-[#C999F8] hover:text-white border-b border-gray-400"
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
                      className="flex items-center w-full text-left px-4 py-2 hover:bg-[#C999F8] hover:text-white"
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
function NavButton({ children, href, active = false, as = 'a', onClick }) {
  const Component = as;
  
  const sharedProps = {
    className: `flex items-center justify-center px-3 h-8 text-sm border-2 ${
      active 
        ? 'border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-gray-300' 
        : 'border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#C0C0C0] hover:bg-gray-300'
    }`,
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