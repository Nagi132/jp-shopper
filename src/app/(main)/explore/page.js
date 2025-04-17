'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import ExploreContent from '@/components/explore/ExploreContent';

export default function ExplorePage() {
  const router = useRouter();
  const { shouldUseDesktop, openWindow, isDesktopReady } = useApp();
  
  // Check if we should redirect to desktop version
  useEffect(() => {
    if (shouldUseDesktop('/explore') && isDesktopReady) {
      // Open the explore window
      openWindow('explore', 'ExplorePage', 'Explore', true);
      
      // Redirect to desktop
      router.push('/desktop');
    }
  }, [shouldUseDesktop, isDesktopReady, router, openWindow]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Explore Items</h1>
      <ExploreContent 
        onItemClick={(item) => {
          if (shouldUseDesktop('/explore')) {
            // First open the item details in the desktop environment
            openWindow(`request-${item.id}`, 'RequestDetail', item.title, true);
            router.push(`/desktop?item=${item.id}`);
          } else {
            // Direct navigation
            router.push(`/requests/${item.id}`);
          }
        }}
      />
    </div>
  );
}