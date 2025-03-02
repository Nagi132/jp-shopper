// app/(main)/layout.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Bell, Home, Search, Plus, ShoppingBag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Bottom Navigation Bar Component
const BottomNav = () => {
  const pathname = usePathname();
  
  // Helper to check if a path is active
  const isActive = (path) => pathname === path || pathname?.startsWith(`${path}/`);
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-lg z-50">
      <div className="flex justify-around items-center p-3">
        <Link href="/explore" className={`w-12 h-12 flex flex-col items-center justify-center ${isActive('/explore') ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link href="/explore/search" className={`w-12 h-12 flex flex-col items-center justify-center ${isActive('/explore/search') ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
          <Search size={20} />
          <span className="text-xs mt-1">Search</span>
        </Link>
        
        <Link href="/requests/new" className="w-16 h-16 flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white -mt-6 shadow-lg">
          <Plus size={24} />
          <span className="text-xs mt-1">Post</span>
        </Link>
        
        <Link href="/requests" className={`w-12 h-12 flex flex-col items-center justify-center ${isActive('/requests') ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
          <ShoppingBag size={20} />
          <span className="text-xs mt-1">Requests</span>
        </Link>
        
        <Link href="/profile" className={`w-12 h-12 flex flex-col items-center justify-center ${isActive('/profile') ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
          <User size={20} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default function MainLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      {/* Top navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Left side - logo */}
            <div className="flex items-center">
              <Link href="/explore" className="ml-3">
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
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content with bottom padding for the navbar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}