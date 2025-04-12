'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import NavigationSidebar from '@/components/layouts/NavigationSidebar';
import { futuraCyrillicMedium, futuraCyrillicLight, futuraCyrillicBold } from '@/lib/fonts';

export default function MainLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    <div className={`min-h-screen bg-[#008080] flex ${futuraCyrillicMedium.variable} ${futuraCyrillicLight.variable} ${futuraCyrillicBold.variable}`}>
      {/* Navigation Sidebar */}
      <NavigationSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-60">
        {/* Marquee Banner */}
        <div className="bg-[#00FFFF] overflow-hidden w-full">
          <div className="py-1 animate-marquee whitespace-nowrap">
            <span className="inline-block mx-4 text-black font-bold">🎮 Rare Collectibles Available Now!</span>
            <span className="inline-block mx-4 text-black font-bold">⌚ Limited Time Offers</span>
            <span className="inline-block mx-4 text-black font-bold">🛍️ Find Exclusive Items from Japan</span>
            <span className="inline-block mx-4 text-black font-bold">🚚 Free Shipping on Orders Over ¥5000</span>
          </div>
        </div>
        
        {/* Desktop Area */}
        <div className="flex-1 p-4 relative overflow-auto">
          {/* Pass content through */}
          {children}
        </div>
      </div>
      
      {/* Add bottom padding on mobile to accommodate the bottom nav */}
      <div className="h-14 md:hidden"></div>
    </div>
  );
}