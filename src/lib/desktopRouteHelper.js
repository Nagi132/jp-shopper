'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';

/**
 * Desktop Route Helper
 * 
 * A standardized way to handle routing to the Windows 2000 desktop interface
 * @param {string} routePath - The path of the current route (e.g., '/dashboard')
 * @param {string} windowId - The ID to use for the window (e.g., 'dashboard')
 * @param {string} component - The component to render in the window (e.g., 'DashboardPage')
 * @param {string} title - The title of the window
 * @returns {Object} - Loading state and render component
 */
export function useDesktopRedirect(routePath, windowId, component, title) {
  const router = useRouter();
  const { openWindow, isDesktopReady } = useApp();
  
  useEffect(() => {
    if (isDesktopReady) {
      // Open the window for this route
      openWindow(windowId, component, title);
      
      // Redirect to root with from=root parameter to prevent duplicate windows
      router.replace('/?from=root');
    }
  }, [isDesktopReady, router, openWindow, windowId, component, title]);
  
  // Default loading component
  return {
    isLoading: true,
    loadingComponent: (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mr-3"></div>
        <p className="text-lg">Loading {title}...</p>
      </div>
    )
  };
}

/**
 * Create a simple desktop route component
 * @param {string} routePath - The path of the current route
 * @param {string} windowId - The ID for the window
 * @param {string} component - The component to render
 * @param {string} title - The window title
 * @returns {Function} - A Next.js page component
 */
export function createDesktopRoute(routePath, windowId, component, title) {
  return function DesktopRouteComponent() {
    const { loadingComponent } = useDesktopRedirect(routePath, windowId, component, title);
    return loadingComponent;
  };
} 