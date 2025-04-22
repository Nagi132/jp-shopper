'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import NewRequestPage from '@/components/windows/NewRequestPage';

export default function NewRequestPageRoute() {
  const router = useRouter();
  const { shouldUseDesktop, openWindow, isDesktopReady } = useApp();
  
  // Check if we should redirect to desktop version
  useEffect(() => {
    if (shouldUseDesktop('/requests/new') && isDesktopReady) {
      // Open the new request window
      openWindow('new-request', 'NewRequestPage', 'Create New Request', true);
      
      // Redirect to desktop
      router.push('/desktop');
    }
  }, [shouldUseDesktop, isDesktopReady, router, openWindow]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create New Request</h1>
      <div className="max-w-3xl mx-auto">
        <NewRequestPage isWindowView={false} />
      </div>
    </div>
  );
}