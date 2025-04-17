'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import WindowsDesktop from '@/components/windows/WindowsDesktop';
import { useApp } from '@/contexts/AppContext';

export default function DesktopPage() {
  const { setDesktopReady, openWindow } = useApp();
  const searchParams = useSearchParams();
  
  // Notify context when desktop is ready
  useEffect(() => {
    setDesktopReady();
    
    // Handle initial window based on query params
    const item = searchParams.get('item');
    if (item) {
      openWindow(`request-${item}`, 'RequestDetail', `Request ${item}`);
    } else {
      // Default to home window
      openWindow('home', 'HomePage', 'Home');
    }
  }, [setDesktopReady, openWindow, searchParams]);
  
  return (
    <WindowsDesktop />
  );
}