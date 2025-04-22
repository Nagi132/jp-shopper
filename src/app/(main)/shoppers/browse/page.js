'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import ShoppersBrowsePage from '@/components/windows/ShoppersBrowsePage';

export default function ShoppersBrowsePageRoute() {
  const router = useRouter();
  const { shouldUseDesktop, openWindow, isDesktopReady } = useApp();
  
  // Check if we should redirect to desktop version
  useEffect(() => {
    if (shouldUseDesktop('/shoppers/browse') && isDesktopReady) {
      // Open the shopper browse window
      openWindow('shoppers-browse', 'ShoppersBrowsePage', 'Available Requests', true);
      
      // Redirect to desktop
      router.push('/desktop');
    }
  }, [shouldUseDesktop, isDesktopReady, router, openWindow]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Available Requests</h1>
      <ShoppersBrowsePage isWindowView={false} />
    </div>
  );
}