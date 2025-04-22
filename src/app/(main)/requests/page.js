'use client';

import { createDesktopRoute } from '@/lib/desktopRouteHelper';

// Create a page that redirects to the desktop with a requests window
export default createDesktopRoute('/requests', 'requests', 'RequestsPage', 'Requests');