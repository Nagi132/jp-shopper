'use client';

import { createDesktopRoute } from '@/lib/desktopRouteHelper';

// Create a page that redirects to the desktop with a profile window
export default createDesktopRoute('/profile', 'profile', 'ProfilePage', 'My Profile');