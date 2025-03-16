'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Bell, Search, ShoppingBag, Package, MessageSquare, Home, User, Plus } from 'lucide-react';
import { futuraCyrillicMedium, futuraCyrillicLight, futuraCyrillicBold } from '@/lib/fonts';

export default function MainLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if it's the explore page
  const isExplore = pathname === '/explore';

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          router.push('/login');
          return;
        }
        
        setUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Loading state with retro styling
  if (loading) {
    return (
      <div className="min-h-screen bg-[#008080] flex items-center justify-center">
        <div className="border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0] p-8 flex flex-col items-center">
          <div className="w-10 h-10 border-t-4 border-r-4 border-[#C999F8] rounded-full animate-spin mb-4"></div>
          <p className="font-futura-medium">Loading JapanShopper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#008080] ${futuraCyrillicMedium.variable} ${futuraCyrillicLight.variable} ${futuraCyrillicBold.variable}`}>
      {/* Marquee Banner */}
      <div className="bg-[#00FFFF] overflow-hidden w-full">
        <div className="py-1 animate-marquee whitespace-nowrap">
          <span className="inline-block mx-4 text-black font-bold">🎮 Rare Collectibles Available Now!</span>
          <span className="inline-block mx-4 text-black font-bold">⌚ Limited Time Offers</span>
          <span className="inline-block mx-4 text-black font-bold">🛍️ Find Exclusive Items from Japan</span>
          <span className="inline-block mx-4 text-black font-bold">🚚 Free Shipping on Orders Over ¥5000</span>
        </div>
      </div>

      {/* Desktop Menu Bar */}
      <div className="bg-[#C0C0C0] border-b border-[#808080]">
        <div className="flex items-center px-2 py-1">
          <div className="font-bold">JapanShopper.exe</div>
          
          <button 
            className="ml-4 px-3 py-0.5 hover:bg-[#d3d3d3]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            File
          </button>
          
          <button className="px-3 py-0.5 hover:bg-[#d3d3d3]">View</button>
          <button className="px-3 py-0.5 hover:bg-[#d3d3d3]">Help</button>
          
          {menuOpen && (
            <div className="absolute top-[65px] left-[50px] bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-md z-50 w-40">
              <Link 
                href="/dashboard" 
                className="block px-4 py-1 hover:bg-[#C999F8] hover:text-white border-b border-[#808080]"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <button 
                onClick={() => {
                  setMenuOpen(false);
                  handleSignOut();
                }} 
                className="block w-full text-left px-4 py-1 hover:bg-[#C999F8] hover:text-white"
              >
                Exit
              </button>
            </div>
          )}
          
          <div className="ml-auto flex items-center">
            <button className="relative p-1">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <Link href="/profile" className="ml-3 flex items-center gap-1 px-2 py-1 border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080]">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Button Toolbar */}
      <div className="bg-[#C0C0C0] border-b border-[#808080] px-3 py-1 flex gap-1">
        <Link 
          href="/dashboard" 
          className={`px-2 py-1 border-2 ${pathname === '/dashboard' 
            ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d3d3d3]' 
            : 'border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]'} flex items-center`}
        >
          <ShoppingBag className="h-4 w-4 mr-1" />
          Shop
        </Link>
        
        <Link 
          href="/requests" 
          className={`px-2 py-1 border-2 ${pathname.startsWith('/requests') 
            ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d3d3d3]' 
            : 'border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]'} flex items-center`}
        >
          <Package className="h-4 w-4 mr-1" />
          Requests
        </Link>
        
        <Link 
          href="/messages" 
          className={`px-2 py-1 border-2 ${pathname === '/messages' 
            ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d3d3d3]' 
            : 'border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]'} flex items-center`}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Messages
        </Link>
        
        <Link 
          href="/explore" 
          className={`px-2 py-1 border-2 ${pathname === '/explore' 
            ? 'border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d3d3d3]' 
            : 'border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0]'} flex items-center`}
        >
          <Search className="h-4 w-4 mr-1" />
          Explore
        </Link>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-1">
        {/* For most pages, wrap in a window */}
        {!isExplore ? (
          <div className="border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] bg-[#C0C0C0] h-full">
            {/* Window Title */}
            <div className="bg-gradient-to-r from-[#C999F8] to-[#D8B5FF] flex justify-between items-center h-7 px-2">
              <span className="text-white font-bold">JapanShopper - Personal Shopping Experience</span>
              <div className="flex">
                <button className="w-4 h-4 bg-[#C0C0C0] border border-[#808080] flex items-center justify-center text-xs ml-1">_</button>
                <button className="w-4 h-4 bg-[#C0C0C0] border border-[#808080] flex items-center justify-center text-xs ml-1">□</button>
                <button className="w-4 h-4 bg-[#C0C0C0] border border-[#808080] flex items-center justify-center text-xs ml-1">×</button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-2 bg-[#C0C0C0]">
              {children}
            </div>
          </div>
        ) : (
          // For explore page, don't add the extra window - it's already styled
          <>{children}</>
        )}
      </main>
      
      {/* Mobile Navigation (hidden on larger screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-white bg-[#C0C0C0] z-50">
        <div className="flex items-center justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center">
            <Home className={`h-5 w-5 ${pathname === '/dashboard' ? 'text-[#C999F8]' : ''}`} />
            <span className="text-xs mt-1">Home</span>
          </Link>
          
          <Link href="/explore" className="flex flex-col items-center">
            <Search className={`h-5 w-5 ${pathname === '/explore' ? 'text-[#C999F8]' : ''}`} />
            <span className="text-xs mt-1">Explore</span>
          </Link>
          
          <Link 
            href="/requests/new" 
            className="flex flex-col items-center justify-center -mt-5 w-14 h-14 rounded-full bg-gradient-to-br from-[#C999F8] to-[#D8B5FF] text-white"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs -mt-1">Post</span>
          </Link>
          
          <Link href="/requests" className="flex flex-col items-center">
            <Package className={`h-5 w-5 ${pathname.startsWith('/requests') ? 'text-[#C999F8]' : ''}`} />
            <span className="text-xs mt-1">Requests</span>
          </Link>
          
          <Link href="/profile" className="flex flex-col items-center">
            <User className={`h-5 w-5 ${pathname === '/profile' ? 'text-[#C999F8]' : ''}`} />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="hidden md:flex border-t border-white bg-[#C0C0C0] py-0.5 px-2 text-xs justify-between items-center">
        <div>Ready</div>
        <div>{new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}