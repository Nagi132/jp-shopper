'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import ExploreContent from '@/components/explore/ExploreContent';

/**
 * ExplorePage - Window version of the Explore page
 * Uses the shared ExploreContent component
 */
const ExplorePage = () => {
  const router = useRouter();
  const { openWindow } = useApp();
  
  // Handle item click in window context
  const handleItemClick = (item) => {
    // Open a new window for the item
    openWindow(`request-${item.id}`, 'RequestDetail', item.title || 'Request Details');
    
    // Also update the URL for deep linking
    router.push(`/requests/${item.id}`, { shallow: true });
  };
  
  return (
    <div className="h-full flex flex-col">
      <ExploreContent 
        className="flex-1 h-full"
        compact={true} // Use compact mode for window
        onItemClick={handleItemClick}
      />
    </div>
  );
};

export default ExplorePage;