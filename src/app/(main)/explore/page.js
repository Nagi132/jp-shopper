'use client';

import { createDesktopRoute } from '@/lib/desktopRouteHelper';

// Create a page that redirects to the desktop with an explore window
export default createDesktopRoute('/explore', 'explore', 'ExplorePage', 'Explore');