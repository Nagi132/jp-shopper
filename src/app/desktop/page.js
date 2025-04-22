'use client';

import { useEffect } from 'react';
import WindowsDesktop from '@/components/windows/WindowsDesktop';
import { useApp } from '@/contexts/AppContext';
import { DialogProvider } from '@/components/windows/MessageBox';

/**
 * Desktop page - Primary application interface that shows the 
 * Windows 2000 desktop experience with taskbar and icons.
 */
export default function Desktop() {
  const { setDesktopReady } = useApp();
  
  // Initialize desktop
  useEffect(() => {
    setDesktopReady();
  }, [setDesktopReady]);
  
  return (
    <DialogProvider>
      <WindowsDesktop />
    </DialogProvider>
  );
}
