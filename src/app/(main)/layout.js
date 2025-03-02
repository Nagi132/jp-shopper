// app/(main)/layout.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Menu, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MainLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
      setLoading(false);
    };

    getUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main navbar - minimal and hidden design */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left side - menu button and logo */}
            <div className="flex items-center">
              <button
                onClick={() => setMenuOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700"
              >
                <Menu size={18} />
              </button>
              
              <Link href="/dashboard" className="ml-3">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-transparent bg-clip-text">
                  JapanShopper
                </span>
              </Link>
            </div>
            
            {/* Right side - notification */}
            <div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  3
                </span>
              </Button>
              <Link href="/profile" className="ml-2">
                <Button variant="ghost" size="sm">Profile</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Slide-out menu */}
      <div className={`fixed inset-0 z-50 transition-transform duration-300 ease-in-out transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        ></div>
        
        {/* Menu panel */}
        <div className="absolute top-0 left-0 h-full w-64 bg-white shadow-lg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b">
            <span className="font-bold text-lg">Menu</span>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </Button>
          </div>
          
          {/* Navigation items */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            <Link 
              href="/dashboard" 
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/requests" 
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Requests
            </Link>
            <Link 
              href="/shoppers" 
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Shoppers
            </Link>
            <Link 
              href="/messages" 
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Messages
            </Link>
          </nav>
          
          {/* Footer */}
          <div className="border-t p-4 space-y-2">
            <Link 
              href="/profile" 
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
            <button 
              className="flex items-center px-3 py-2 w-full text-left rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
              onClick={() => {
                setMenuOpen(false);
                handleSignOut();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}