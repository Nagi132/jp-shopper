'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import WindowsDesktop from '@/components/windows/WindowsDesktop';
import { useApp } from '@/contexts/AppContext';
import { DialogProvider } from '@/components/windows/MessageBox';

/**
 * Dashboard page - This is the main application interface
 * that shows the Windows 2000 desktop experience with navbar and home window.
 */
export default function Dashboard() {
  const { openWindow, openWindows, windowsLoaded, setDesktopReady } = useApp();
  const searchParams = useSearchParams();
  const [initialized, setInitialized] = useState(false);
  
  // Initialize desktop
  useEffect(() => {
    setDesktopReady();
  }, [setDesktopReady]);
  
  // Automatically open home window if none exist
  useEffect(() => {
    if (!windowsLoaded || initialized) return;
    
    const fromParam = searchParams.get('from');
    
    // Only open Home window if:
    // 1. Windows are loaded
    // 2. No "from=root" parameter (which would indicate we came from a redirect)
    // 3. No windows are currently open
    if (windowsLoaded && fromParam !== 'root' && openWindows.length === 0) {
      // Open Home window by default
      openWindow('home', 'HomePage', 'Home');
    }
    
    setInitialized(true);
  }, [windowsLoaded, openWindows.length, searchParams, openWindow, initialized]);
  
  return (
    <DialogProvider>
      <WindowsDesktop />
    </DialogProvider>
  );
}