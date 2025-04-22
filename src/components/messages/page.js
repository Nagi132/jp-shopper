'use client';

import { createDesktopRoute } from '@/lib/desktopRouteHelper';

// Create a page that redirects to the desktop with a messages window
export default createDesktopRoute('/messages', 'messages', 'MessagesPage', 'Messages');