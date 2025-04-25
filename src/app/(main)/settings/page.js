'use client';

import { createDesktopRoute } from '@/lib/desktopRouteHelper';
 
// Create a page that redirects to the desktop with a settings window
export default createDesktopRoute('/settings', 'settings', 'SettingsPage', 'Settings'); 