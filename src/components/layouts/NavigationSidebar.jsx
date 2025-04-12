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
 */
const NavigationSidebar = () => {
  const pathname = usePathname();

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
      <aside className="hidden md:flex flex-col w-60 bg-[#C0C0C0] border-t border-l border-white border-r border-b border-gray-600 p-3 fixed left-0 top-0 h-full">
        <div className="flex items-center px-2 mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#C999F8] to-[#D8B5FF] text-transparent bg-clip-text">
            JapanShopper.exe
          </h1>
        </div>

        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md border border-transparent",
                    pathname === item.href
                      ? "border-t-gray-600 border-l-gray-600 border-r-white border-b-white bg-gray-300"
                      : "hover:bg-gray-200",
                    item.highlight && "bg-gradient-to-r from-[#C999F8] to-[#D8B5FF] hover:opacity-90"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-6">
          <Link
            href="/settings"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-200"
          >
            <Settings className="h-5 w-5" />
            <span className="ml-3">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#C0C0C0] border-t-2 border-gray-600 z-50">
        <div className="grid grid-cols-5 h-14">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                pathname === item.href ? "text-[#C999F8]" : "text-gray-700"
              )}
            >
              {item.highlight ? (
                <div className="bg-gradient-to-r from-[#C999F8] to-[#D8B5FF] w-10 h-10 rounded-full flex items-center justify-center">
                  {item.icon}
                </div>
              ) : (
                item.icon
              )}
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default NavigationSidebar;