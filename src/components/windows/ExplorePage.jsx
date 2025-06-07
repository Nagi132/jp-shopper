'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import ExploreContent from '@/components/explore/ExploreContent';
import { WindowContainer } from '@/components/ui/window-container';

/**
 * ExplorePage - Window version of the Explore page
 * Uses the shared ExploreContent component with unified window styling
 */
const ExplorePage = () => {
  const router = useRouter();
  const { openWindow } = useApp();
  
  // Handle item click in window context
  const handleItemClick = (item) => {
    console.log('ExplorePage: handleItemClick called with item:', item);
    
    // Determine if this is a listing or request based on item_type
    if (item.item_type === 'listing') {
      console.log('ExplorePage: Opening listing window with id:', `item-${item.id}`);
      
      // Open a new window for the listing
      openWindow(`item-${item.id}`, 'ItemDetail', item.title || 'Item Details');
      
      // Also update the URL for deep linking
      router.push(`/item/${item.id}`, { shallow: true });
    } else {
      // This is a request - handle as before
      console.log('ExplorePage: Opening request window with id:', `request-${item.id}`);
      openWindow(`request-${item.id}`, 'RequestDetail', item.title || 'Request Details');
      
      // Also update the URL for deep linking
      router.push(`/requests/${item.id}`, { shallow: true });
    }
  };
  
  return (
    <WindowContainer padding={false}>
      <ExploreContent 
        className="h-full"
        compact={true} // Use compact mode for window
        onItemClick={handleItemClick}
      />
    </WindowContainer>
  );
};

export default ExplorePage;